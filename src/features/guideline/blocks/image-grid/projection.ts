import { compact, formatImage, relationshipId } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

type ImageGrid = Extract<GuidelineBlock, { blockType: 'imageGrid' }>

export function projectImageGrid(block: ImageGrid) {
	const cells = block.cells ?? []
	const title = block.title?.trim() || undefined
	const description = extractTextFromLexical(block.description).trim() || undefined

	return {
		text: compact([
			title ?? 'Image grid',
			description,
			...cells.map((cell) => compact([cell.caption, formatImage(cell.image)]).join(' ')),
		]).join('\n'),
		evidence: { type: 'imageGrid' as const, title },
		referenceAssets: cells
			.map((cell) => relationshipId(cell.image))
			.filter((id): id is number => id != null)
			.map((id) => ({ id, role: 'context' as const })),
	}
}

export default projectImageGrid
