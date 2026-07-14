import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { env } from '@/env'

const DEFAULT_MODEL = 'claude-haiku-4-5'

/**
 * 유스케이스 경계: 프롬프트(+선택 rule)로 텍스트 후보 N개를 생성한다.
 * 외부 I/O(Anthropic 호출)는 이 서비스가 소유하고, 상위(route·표면)는 인증·검증만 한다.
 * rule은 슬롯에 붙은 제약(예: "명사형 행사 제목")으로, 생성 지시문에 그대로 얹힌다.
 */
export async function generateTextCandidates({
	prompt,
	rule,
	count,
}: {
	prompt: string
	rule?: string
	count: number
}): Promise<string[]> {
	if (!env.ANTHROPIC_API_KEY) return []

	const system = [
		'너는 브랜드 콘텐츠 카피라이터다. 요청에 맞는 짧은 텍스트를 쓴다.',
		rule ? `제약(반드시 지킬 것): ${rule}` : '',
		'설명·따옴표·머리기호 없이 결과 텍스트만 출력한다.',
	]
		.filter(Boolean)
		.join(' ')

	// 후보는 서로 독립이라 병렬 생성한다. 실패한 후보는 빼고 성공분만 돌려준다.
	const results = await Promise.all(
		Array.from({ length: count }, () =>
			generateText({
				model: anthropic(env.ANTHROPIC_MODEL || DEFAULT_MODEL),
				system,
				prompt,
				temperature: 1,
			})
				.then((r) => r.text.trim())
				.catch(() => null),
		),
	)

	return results.filter((text): text is string => text !== null && text.length > 0)
}
