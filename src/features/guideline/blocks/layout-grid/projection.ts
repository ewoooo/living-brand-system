import { compact } from '../../utils/block-text'
import type { GuidelineBlock } from '../types'

type LayoutGrid = Extract<GuidelineBlock, { blockType: 'layoutGrid' }>

export function projectLayoutGrid(block: LayoutGrid) {
	const variants = (block.variants ?? []).map((variant) => ({
		label: variant.label?.trim() || undefined,
		columns: variant.columns,
		gutter: variant.gutter?.trim() || undefined,
		margin: variant.margin?.trim() || undefined,
	}))

	return {
		text: compact(
			variants.map((variant) =>
				compact([
					variant.label,
					`Columns: ${variant.columns}`,
					variant.gutter ? `Gutter: ${variant.gutter}` : undefined,
					variant.margin ? `Margin: ${variant.margin}` : undefined,
				]).join('\n'),
			),
		).join('\n\n'),
		evidence: { type: 'layoutGrid' as const, variants },
		referenceAssets: [],
	}
}

export default projectLayoutGrid
