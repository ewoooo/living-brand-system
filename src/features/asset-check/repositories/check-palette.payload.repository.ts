import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * 검수 팔레트 조회 repository — published brand-colors를 checker 입력의 원천으로 읽는다.
 */
export async function getCheckPaletteColors() {
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

	return colors.docs
}
