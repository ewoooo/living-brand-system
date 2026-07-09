import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * 검수 룰셋 조회 repository — 페이지 배치와 연결된 Rule 기준값을 함께 읽는다.
 * asset-check 기능의 Payload Local API 호출은 모두 이 파일이 소유한다.
 */
export async function getCheckRulesetPages() {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		depth: 3, // rules[].rule.referenceAssets, section.chapter를 채운다
		sort: 'displayOrder',
		limit: 100,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
	})

	return pages.docs
}

export async function getCheckRuleDocs() {
	const payload = await getPayload({ config })
	const rules = await payload.find({
		collection: 'rules',
		depth: 1,
		sort: 'key',
		limit: 200,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		where: { status: { equals: 'live' } },
	})

	return rules.docs
}
