import type { ApplicationImage, GuidelineDocument, Rule } from '@/payload-types'
import {
	buildCheckSourceSnapshot,
	type GuidelineCheckDocument,
} from '../blocks/runtime/build-check-source-snapshot'
import { type CheckEvidence, snapshotBlock } from '../blocks/runtime/project-guideline-block'
import type { CheckReferenceAssetRole } from '../blocks/types'
import { relationshipId } from '../utils/block-text'

export interface GuidelineCheckSource {
	rule: Rule
	blockName: string | null
	source: { documentId: number }
	evidence: CheckEvidence
	referenceAssets: { asset: ApplicationImage; role: CheckReferenceAssetRole }[]
}

/** 문서와 임베디드 Block이 참조하는 Rule을 실행 가능한 source snapshot과 함께 수집한다. */
export function collectGuidelineCheckSources(
	document: GuidelineCheckDocument,
): GuidelineCheckSource[] {
	const assets = collectApplicationImages(document)
	const documentSnapshot = buildCheckSourceSnapshot(document)
	const documentSources = toSources(document.rules, document.id, null, documentSnapshot, assets)
	const blockSources = (document.blocks ?? []).flatMap((block) =>
		toSources(
			block.rules,
			document.id,
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
				source: { documentId },
				evidence: snapshot.evidence,
				referenceAssets: snapshot.referenceAssets.flatMap((reference) => {
					const asset = assets.get(reference.id)
					return asset ? [{ asset, role: reference.role }] : []
				}),
			},
		]
	})
}

function collectApplicationImages(document: GuidelineCheckDocument): Map<number, ApplicationImage> {
	const values: unknown[] = []
	if ('headerImage' in document) values.push(document.headerImage)

	for (const block of document.blocks ?? []) {
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
