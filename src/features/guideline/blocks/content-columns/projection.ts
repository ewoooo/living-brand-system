import { compact, formatImage, relationshipId } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

type ContentColumns = Extract<GuidelineBlock, { blockType: 'contentColumns' }>

export function projectContentColumns(block: ContentColumns) {
	const text = compact(
		block.columns?.map((column) =>
			compact([
				column.heading,
				extractTextFromLexical(column.body),
				formatImage(column.image),
			]).join('\n'),
		) ?? [],
	).join('\n\n')

	return {
		text,
		evidence: {
			type: 'contentColumns' as const,
			columns: (block.columns ?? []).map((column) => ({
				heading: column.heading?.trim() || undefined,
				body: extractTextFromLexical(column.body).trim() || undefined,
			})),
		},
		referenceAssets: (block.columns ?? [])
			.map((column) => relationshipId(column.image))
			.filter((id): id is number => id != null)
			.map((id) => ({ id, role: 'context' as const })),
	}
}
