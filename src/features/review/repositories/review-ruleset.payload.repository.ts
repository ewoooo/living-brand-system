import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * 검수 룰셋 조회 repository — 룰 배치(rules 배열)를 가진 published 가이드라인 페이지를 읽는다.
 * review 기능의 Payload Local API 호출은 모두 이 파일이 소유한다.
 */
export async function listPublishedPagesWithRules() {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		depth: 1, // rules[].rule + section을 채운다
		sort: 'displayOrder',
		limit: 100,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			title: true,
			slug: true,
			displayOrder: true,
			section: true,
			rules: true,
		},
	})

	return pages.docs
}
