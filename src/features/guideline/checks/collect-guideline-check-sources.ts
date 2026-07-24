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
			case 'carousel':
				values.push(...(block.slides ?? []).map((slide) => slide.image))
				break
			case 'mediaShowcase':
				values.push(...(block.images ?? []).map((item) => item.image))
				break
			case 'doDont':
				values.push(
					...(block.groups ?? []).flatMap((group) =>
						(group.examples ?? []).map((example) => example.image),
					),
				)
				break
			case 'logoGroupViewer':
				// projectLogoGroupViewer가 로고/®/클리어스페이스 이미지를 referenceAsset으로 내보내므로
				// AI 검수에 도달하도록 여기서 application-images를 Map에 넣는다.
				values.push(
					...(block.logos ?? []).flatMap((row) => [
						row.logo,
						row.registeredMark,
						row.clearSpaceGuide,
					]),
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
