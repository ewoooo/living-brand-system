import type { ApplicationImage, GuidelineDocument, Rule } from '@/payload-types'
import {
	buildCheckSourceSnapshot,
	type GuidelineCheckDocument,
} from '../blocks/runtime/build-check-source-snapshot'
import { type CheckEvidence, snapshotBlock } from '../blocks/runtime/project-guideline-block'
import type { CheckReferenceAssetRole, GuidelineBlock } from '../blocks/types'
import { relationshipId } from '../utils/block-text'

/** 근거가 놓인 꼭지. 문서 자신의 rule이면 null이다. */
export interface GuidelineCheckSection {
	anchor: string
	title: string
	/** 문서 본문에서의 위치. 검수 화면이 꼭지 순서를 지면 순서와 맞추는 데 쓴다. */
	order: number
}

export interface GuidelineCheckSource {
	rule: Rule
	blockName: string | null
	// 🔴 documentId만으로는 근거가 토픽까지만 좁혀진다. 꼭지가 문서였을 때의 정밀도를 되돌리려면
	//    앵커가 함께 있어야 한다(2026-08-26 이관으로 3단계 문서가 section 블록이 됐다).
	source: { documentId: number; section: GuidelineCheckSection | null }
	evidence: CheckEvidence
	referenceAssets: { asset: ApplicationImage; role: CheckReferenceAssetRole }[]
}

/** 문서와 임베디드 Block이 참조하는 Rule을 실행 가능한 source snapshot과 함께 수집한다. */
export function collectGuidelineCheckSources(
	document: GuidelineCheckDocument,
): GuidelineCheckSource[] {
	const assets = collectApplicationImages(document)
	const documentSnapshot = buildCheckSourceSnapshot(document)
	const documentSources = toSources(
		document.rules,
		document.id,
		null,
		null,
		documentSnapshot,
		assets,
	)
	const blockSources = flattenBlocks(document.blocks).flatMap(({ block, section }) =>
		toSources(
			block.rules,
			document.id,
			section,
			block.blockName?.trim() || block.blockType,
			snapshotBlock(block),
			assets,
		),
	)

	return [...documentSources, ...blockSources]
}

function toSources(
	rules: GuidelineDocument['rules'] | undefined,
	documentId: number,
	section: GuidelineCheckSection | null,
	blockName: string | null,
	snapshot: ReturnType<typeof buildCheckSourceSnapshot>,
	assets: Map<number, ApplicationImage>,
): GuidelineCheckSource[] {
	if (!snapshot) return []

	// depth 부족으로 populate되지 않은 관계(number)는 실행할 수 없으므로 건너뛴다.
	return (rules ?? []).flatMap((rule) => {
		if (typeof rule !== 'object' || rule === null) return []

		return [
			{
				rule,
				blockName,
				source: { documentId, section },
				evidence: snapshot.evidence,
				referenceAssets: snapshot.referenceAssets.flatMap((reference) => {
					const asset = assets.get(reference.id)
					return asset ? [{ asset, role: reference.role }] : []
				}),
			},
		]
	})
}

/**
 * 꼭지(section)가 품은 자식 블록까지 한 줄로 펴되, 각 블록이 **어느 꼭지에 속하는지**를 달고 나온다.
 *
 * 🔴 내려가지 않으면 자식 블록의 rule이 **조용히 소멸한다.** 2026-08-26에 꼭지가 문서에서 블록이
 *    되면서 rules를 가진 컨테이너가 한 겹 깊어졌다 — docs/11 §4의 provenance 불변식이 그대로
 *    성립하려면 수집도 같이 내려가야 한다.
 * 🔴 재귀가 아니라 한 겹이다. section 안에는 LayoutBlock만 들어가고, 그 블록은 자식으로 leaf만 갖는다.
 */
function flattenBlocks(
	blocks: GuidelineCheckDocument['blocks'],
): { block: GuidelineBlock; section: GuidelineCheckSection | null }[] {
	type Entry = { block: GuidelineBlock; section: GuidelineCheckSection | null }
	return (blocks ?? []).flatMap<Entry>((block, order) => {
		if (block.blockType !== 'section') return [{ block, section: null }]

		const section: GuidelineCheckSection = {
			anchor: block.anchor,
			title: block.title,
			order,
		}
		return [
			{ block, section },
			...(block.blocks ?? []).map((child) => ({ block: child, section })),
		]
	})
}

function collectApplicationImages(document: GuidelineCheckDocument): Map<number, ApplicationImage> {
	const values: unknown[] = []
	if ('headerImage' in document) values.push(document.headerImage)

	for (const { block } of flattenBlocks(document.blocks)) {
		switch (block.blockType) {
			case 'contentColumns':
				values.push(...(block.columns ?? []).map((column) => column.image))
				break
			case 'block':
				// 컨테이너 블록의 자식 위젯이 가진 이미지를 id→이미지 조회 맵에 넣는다.
				//
				// 🔴 이것만으로는 AI 검수 커버리지가 복구되지 않는다. 이 맵은 조회용이고, 실제로
				//    어떤 이미지를 참조하는지 지목하는 건 `blocks/block/projection.ts`의 projectBlock인데
				//    그게 아직 `referenceAssets: []`를 반환한다(evidence도 childCount 자리표시자다).
				//    즉 rules를 가진 컨테이너 블록은 지금도 참조 이미지를 못 내보낸다.
				//    위젯별 evidence 설계가 그 파일에 미뤄져 있고, 그게 끝나야 이 case가 실제로 쓰인다.
				values.push(
					...(block.children ?? []).flatMap((child) =>
						child.blockType === 'doDontWidget'
							? (child.examples ?? []).map((example) => example.image)
							: child.blockType === 'image'
								? [child.image]
								: [],
					),
				)
				break
		}
	}

	return new Map(
		values.flatMap((value): [number, ApplicationImage][] => {
			const id = relationshipId(value)
			return id != null && typeof value === 'object' && value !== null
				? [[id, value as ApplicationImage]]
				: []
		}),
	)
}
