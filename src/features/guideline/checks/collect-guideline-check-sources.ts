import type { ApplicationImage, GuidelineChecks } from '@/payload-types'
import {
	buildCheckSourceSnapshot,
	type GuidelineCheckDocument,
} from '../blocks/check-source-snapshot'
import { snapshotBlock } from '../blocks/registry'
import { relationshipId } from '../utils/block-text'
import type { CheckEvidence, CheckReferenceAssetRole } from './check-source'

type GuidelineCheck = NonNullable<GuidelineChecks>[number]

export interface GuidelineCheckSource {
	check: GuidelineCheck
	blockName: string | null
	source: { documentId: number }
	evidence: CheckEvidence
	referenceAssets: { asset: ApplicationImage; role: CheckReferenceAssetRole }[]
}

/** 문서와 임베디드 Block의 Check를 실행 가능한 source snapshot과 함께 수집한다. */
export function collectGuidelineCheckSources(
	document: GuidelineCheckDocument,
): GuidelineCheckSource[] {
	const assets = collectApplicationImages(document)
	const documentSnapshot = buildCheckSourceSnapshot(document)
	const documentChecks = toSources(document.checks, document.id, null, documentSnapshot, assets)
	const blockChecks = (document.blocks ?? []).flatMap((block) =>
		toSources(
			block.checks,
			document.id,
			block.blockName?.trim() || block.blockType,
			snapshotBlock(block),
			assets,
		),
	)

	return [...documentChecks, ...blockChecks]
}

function toSources(
	checks: GuidelineChecks | undefined,
	documentId: number,
	blockName: string | null,
	snapshot: ReturnType<typeof buildCheckSourceSnapshot>,
	assets: Map<number, ApplicationImage>,
): GuidelineCheckSource[] {
	if (!snapshot) return []

	return (checks ?? []).map((check) => ({
		check,
		blockName,
		source: { documentId },
		evidence: snapshot.evidence,
		referenceAssets: snapshot.referenceAssets.flatMap((reference) => {
			const asset = assets.get(reference.id)
			return asset ? [{ asset, role: reference.role }] : []
		}),
	}))
}

function collectApplicationImages(document: GuidelineCheckDocument): Map<number, ApplicationImage> {
	const values: unknown[] = []
	if ('headerImage' in document) values.push(document.headerImage)

	for (const block of document.blocks ?? []) {
		switch (block.blockType) {
			case 'columnUnit':
				values.push(...(block.columns ?? []).map((column) => column.image))
				break
			case 'mediaShowcase':
				values.push(block.image)
				break
			case 'doDont':
				values.push(
					...(block.groups ?? []).flatMap((group) =>
						(group.examples ?? []).map((example) => example.image),
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
