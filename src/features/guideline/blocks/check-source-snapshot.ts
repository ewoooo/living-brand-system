import type { GuidelineDocument } from '@/payload-types'
import { relationshipId } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import type { CheckSourceSnapshot } from './catalog'
import { snapshotBlock } from './registry'

export type GuidelineCheckDocument = Pick<
	GuidelineDocument,
	'blocks' | 'checks' | 'description' | 'headerImage' | 'id'
>

/** Section/Page 전체 또는 blockId가 가리키는 단일 Block을 Check source로 정규화한다. */
export function buildCheckSourceSnapshot(
	document: GuidelineCheckDocument,
	blockId?: string | null,
): CheckSourceSnapshot | null {
	const blocks = document.blocks ?? []
	if (blockId) {
		const block = blocks.find((candidate) => candidate.id === blockId)
		return block ? snapshotBlock(block) : null
	}

	const blockSnapshots = blocks.map(snapshotBlock)
	const headerImage = document.headerImage
	const headerImageId = relationshipId(headerImage)
	const description = document.description ? extractTextFromLexical(document.description) : null

	return {
		evidence: {
			type: 'document',
			description: description?.trim() || undefined,
			blocks: blockSnapshots.map((snapshot) => snapshot.evidence),
		},
		referenceAssets: [
			...(headerImageId == null ? [] : [{ id: headerImageId, role: 'context' as const }]),
			...blockSnapshots.flatMap((snapshot) => snapshot.referenceAssets),
		].filter(
			(asset, index, assets) =>
				assets.findIndex(
					(candidate) => candidate.id === asset.id && candidate.role === asset.role,
				) === index,
		),
	}
}
