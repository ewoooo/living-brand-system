import type { GuidelineBlock } from '../types'

type GlyphGrid = Extract<GuidelineBlock, { blockType: 'glyphGrid' }>

export function projectGlyphGrid(block: GlyphGrid) {
	const title = block.title?.trim() || undefined
	const typeface =
		typeof block.typeface === 'object' && block.typeface !== null
			? { name: block.typeface.name, familyName: block.typeface.familyName }
			: undefined

	return {
		text: [title ?? 'Glyph grid', typeface?.name].filter(Boolean).join('\n'),
		evidence: { type: 'glyphGrid' as const, title, typeface },
		referenceAssets: [],
	}
}
