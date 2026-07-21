import type { BrandColor } from '@/payload-types'
import { compact } from '../../utils/block-text'
import type { GuidelineBlock } from '../types'

type ColorPalette = Extract<GuidelineBlock, { blockType: 'colorPalette' }>

export function projectColorPalette(block: ColorPalette) {
	const colors = block.colors.filter(
		(color): color is BrandColor => typeof color === 'object' && color !== null,
	)

	return {
		text: compact([
			block.title ?? 'Color palette',
			...colors.map(
				(color) =>
					`- ${color.name}: HEX ${color.hex}${color.pantone ? `, PMS ${color.pantone}` : ''}`,
			),
		]).join('\n'),
		evidence: {
			type: 'colorPalette' as const,
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
}

export default projectColorPalette
