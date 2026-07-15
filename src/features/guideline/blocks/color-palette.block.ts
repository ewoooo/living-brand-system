import type { BrandColor } from '@/payload-types'
import { compact } from '../utils/block-text'
import type { BlockBehavior, GuidelineBlock } from './types'

function format(block: GuidelineBlock): string {
	if (block.blockType !== 'colorPalette') return ''
	const colors = block.colors.filter(
		(color): color is BrandColor => typeof color === 'object' && color !== null,
	)
	return compact([
		block.title ?? 'Color palette',
		...colors.map(
			(color) =>
				`- ${color.name}: HEX ${color.hex}${color.pantone ? `, PMS ${color.pantone}` : ''}`,
		),
	]).join('\n')
}

export const behavior: BlockBehavior = {
	formatForAgent: format,
	toCheckSourceSnapshot: (block) => {
		if (block.blockType !== 'colorPalette') {
			return {
				evidence: { type: 'colorPalette', colors: [] },
				referenceAssets: [],
			}
		}
		return {
			evidence: {
				type: 'colorPalette',
				title: block.title?.trim() || undefined,
				colors: block.colors.flatMap((color) =>
					typeof color === 'object' && color !== null
						? [
								{
									name: color.name,
									hex: color.hex,
									pantone: color.pantone?.trim() || undefined,
								},
							]
						: [],
				),
			},
			referenceAssets: [],
		}
	},
}
