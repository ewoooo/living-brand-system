import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Swatch, SwatchFamily } from '@/features/asset-check/checkers/palette-match'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

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
 * 검수 checker가 쓰는 팔레트 스냅샷을 published brand-colors 컬렉션에서 만든다.
 * Payload 조회 I/O도 이 service가 직접 소유한다.
 */
export const getCheckPalette = cache(async (): Promise<Swatch[]> => {
	const payload = await getPayload({ config })
	const colors = await payload.find({
		collection: 'brand-colors',
		depth: 0,
		sort: 'colorGroup',
		limit: 100,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			name: true,
			hex: true,
			colorGroup: true,
		},
	})

	return colors.docs.flatMap((color) => {
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
