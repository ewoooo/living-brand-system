import { cache } from 'react'
import type { Swatch, SwatchFamily } from '@/features/asset-check/checkers/palette-match'
import { getCheckPaletteColors } from '@/features/asset-check/repositories/check-palette.payload.repository'

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
 * Payload 조회는 check-palette repository가 소유한다.
 */
export const getCheckPalette = cache(async (): Promise<Swatch[]> => {
	const colors = await getCheckPaletteColors()

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
