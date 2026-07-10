import type { GuidelinePage, GuidelineSection } from '@/payload-types'
import { compact, formatImage, relationshipId } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import { snapshotBlock } from './registry'
import type { CheckSourceSnapshot } from './types'

export type GuidelineCheckDocument =
	| Pick<GuidelinePage, 'blocks' | 'checks' | 'description' | 'title'>
	| Pick<GuidelineSection, 'blocks' | 'checks' | 'description' | 'headerImage' | 'title'>

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
	const isSection = 'headerImage' in document
	const headerImageId = isSection ? relationshipId(document.headerImage) : null
	const description = isSection
		? document.description
		: document.description
			? extractTextFromLexical(document.description)
			: null

	return {
		evidence: compact([
			document.title,
			description,
			isSection ? formatImage(document.headerImage) : null,
			...blockSnapshots.map((snapshot) => snapshot.evidence),
		]).join('\n\n'),
		referenceAssets: [
			...(headerImageId == null ? [] : [headerImageId]),
			...blockSnapshots.flatMap((snapshot) => snapshot.referenceAssets),
		].filter((id, index, ids) => ids.indexOf(id) === index),
	}
}
