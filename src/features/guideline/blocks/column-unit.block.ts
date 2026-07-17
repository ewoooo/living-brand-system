import { compact, formatImage, relationshipId } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import type { GuidelineBlock } from './types'

type ColumnUnit = Extract<GuidelineBlock, { blockType: 'columnUnit' }>

export function projectColumnUnit(block: ColumnUnit) {
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
			type: 'columnUnit' as const,
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
