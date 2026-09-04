import type { ApplicationImage, GuidelineDocument, Rule } from '@/payload-types'
import {
	buildCheckSourceSnapshot,
	type GuidelineCheckDocument,
} from '../blocks/runtime/build-check-source-snapshot'
import { type CheckEvidence, snapshotBlock } from '../blocks/runtime/project-guideline-block'
import type { CheckReferenceAssetRole, GuidelineBlock } from '../blocks/types'
import { relationshipId } from '../utils/block-text'

/** 근거가 놓인 섹션. 문서 자신의 rule이면 null이다. */
export interface GuidelineCheckSection {
	anchor: string
	title: string
	/** 문서 본문에서의 위치. 검수 화면이 섹션 순서를 지면 순서와 맞추는 데 쓴다. */
	order: number
}

export interface GuidelineCheckSource {
	rule: Rule
	blockName: string | null
	// 🔴 documentId만으로는 근거가 토픽까지만 좁혀진다. 섹션가 문서였을 때의 정밀도를 되돌리려면
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
 * 섹션(section)이 품은 자식 블록까지 한 줄로 펴되, 각 블록이 **어느 섹션에 속하는지**를 달고 나온다.
 *
 * 🔴 내려가지 않으면 자식 블록의 rule이 **조용히 소멸한다.** 2026-08-26에 섹션가 문서에서 블록이
 *    되면서 rules를 가진 컨테이너가 한 겹 깊어졌다 — docs/11 §4의 provenance 불변식이 그대로
 *    성립하려면 수집도 같이 내려가야 한다.
 * 🔴 재귀가 아니라 고정 깊이다 — section > block > subBlock에서 끝난다(schema.ts의 layoutFields).
 */
function flattenBlocks(
	blocks: GuidelineCheckDocument['blocks'],
): { block: GuidelineBlock; section: GuidelineCheckSection | null }[] {
	type Entry = { block: GuidelineBlock; section: GuidelineCheckSection | null }
	return (blocks ?? []).flatMap<Entry>((block, order) => {
		if (block.blockType !== 'section') return [{ block, section: null }]

		const section: GuidelineCheckSection = {
			// 앵커는 저장 시 제목에서 자동으로 채워지지만(section/schema.ts) 타입은 선택이다.
			anchor: block.anchor ?? '',
			title: block.title,
			order,
		}
		// 🔴 하위 블록(subBlock)까지 내려간다. 컨테이너는 rules를 가질 수 있고, 안 훑으면
		//    그 rule이 조용히 소멸한다(docs/11 §4 provenance 불변식).
		return [
			{ block, section },
			...(block.blocks ?? []).flatMap((child) => [
				{ block: child as GuidelineBlock, section },
				...(child.children ?? []).flatMap((grandChild) =>
					grandChild.blockType === 'subBlock'
						? [{ block: grandChild as unknown as GuidelineBlock, section }]
						: [],
				),
			]),
		]
	})
}

function collectApplicationImages(document: GuidelineCheckDocument): Map<number, ApplicationImage> {
	const values: unknown[] = []
	if ('headerImage' in document) values.push(document.headerImage)

	// 🔴 컨테이너 Block의 자식 위젯 이미지는 넣지 않는다 — 검수가 읽는 것은 Block이 소유한
	//    title·description·rule뿐이고 자식 위젯은 사람이 보는 표현이라는 결정(2026-08-12,
	//    `blocks/block/projection.ts`가 정본)이다. projectBlock·projectSection이 referenceAssets를
	//    비워 돌려주므로 여기서 모아 봐야 참조하는 쪽이 없다.
	for (const { block } of flattenBlocks(document.blocks)) {
		if (block.blockType === 'contentColumns') {
			values.push(...(block.columns ?? []).map((column) => column.image))
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
