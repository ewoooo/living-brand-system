import type { ApplicationImage, GuidelineChecks } from '@/payload-types'
import {
	buildCheckSourceSnapshot,
	type GuidelineCheckDocument,
} from '../blocks/check-source-snapshot'
import { snapshotBlock } from '../blocks/registry'
import { relationshipId } from '../utils/block-text'

type GuidelineCheck = NonNullable<GuidelineChecks>[number]

export interface GuidelineCheckSource {
	check: GuidelineCheck
	blockId: string | null
	evidence: string
	referenceAssets: ApplicationImage[]
}

/** 문서와 임베디드 Block의 Check를 실행 가능한 source snapshot과 함께 수집한다. */
export function collectGuidelineCheckSources(
	document: GuidelineCheckDocument,
): GuidelineCheckSource[] {
	const assets = collectApplicationImages(document)
	const documentSnapshot = buildCheckSourceSnapshot(document)
	const documentChecks = toSources(document.checks, null, documentSnapshot, assets)
	const blockChecks = (document.blocks ?? []).flatMap((block) =>
		toSources(block.checks, block.id ?? null, snapshotBlock(block), assets),
	)

	return [...documentChecks, ...blockChecks]
}

function toSources(
	checks: GuidelineChecks | undefined,
	blockId: string | null,
	snapshot: ReturnType<typeof buildCheckSourceSnapshot>,
	assets: Map<number, ApplicationImage>,
): GuidelineCheckSource[] {
	if (!snapshot) return []

	return (checks ?? []).map((check) => ({
		check,
		blockId,
		evidence: snapshot.evidence,
		referenceAssets: snapshot.referenceAssets.flatMap((id) => {
			const asset = assets.get(id)
			return asset ? [asset] : []
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
