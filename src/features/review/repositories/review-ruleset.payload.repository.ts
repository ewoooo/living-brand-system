import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * 검수 룰셋 조회 repository — rule-bindings(룰 값 배치)를 rule·page·section 관계와 함께 읽는다.
 * review 기능의 Payload Local API 호출은 모두 이 파일이 소유한다.
 */
export async function listRuleBindingPlacements() {
	const payload = await getPayload({ config })
	const bindings = await payload.find({
		collection: 'rule-bindings',
		depth: 2, // rule + page.section까지 채운다
		sort: 'id', // 시드 생성 순서 = 가이드라인 원문 등장 순서
		limit: 1000,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
	})

	return bindings.docs
}
