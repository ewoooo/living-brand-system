import { cache } from 'react'
import type { Swatch, SwatchFamily } from '@/features/review/checkers/color/palette-match'
import { listReviewPaletteColors } from '@/features/review/repositories/review-palette.payload.repository'

function swatchFamily(colorGroup: unknown): SwatchFamily | null {
	if (colorGroup === 'neutral') return 'extreme'
	if (
		colorGroup === 'red' ||
		colorGroup === 'yellow' ||
		colorGroup === 'green' ||
		colorGroup === 'blue' ||
		colorGroup === 'purple' ||
		colorGroup === 'gray'
	) {
		return colorGroup
	}
	return null
}

/**
 * 검수 checker가 쓰는 팔레트 스냅샷을 brand-colors 컬렉션에서 만든다.
 */
export const getReviewPalette = cache(async (): Promise<Swatch[]> => {
	const colors = await listReviewPaletteColors()

	return colors.flatMap((color) => {
		const family = swatchFamily(color.colorGroup)
		if (!family) return []
		return [
			{
				name: color.name,
				hex: color.hex,
				family,
			},
		]
	})
})
