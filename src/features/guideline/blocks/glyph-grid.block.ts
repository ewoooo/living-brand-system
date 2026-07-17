import type { GuidelineBlock } from './types'

type GlyphGrid = Extract<GuidelineBlock, { blockType: 'glyphGrid' }>

export function projectGlyphGrid(block: GlyphGrid) {
	const title = block.title?.trim() || undefined

	return {
		text: title ?? 'Glyph grid',
		evidence: { type: 'glyphGrid' as const, title },
		referenceAssets: [],
	}
}
