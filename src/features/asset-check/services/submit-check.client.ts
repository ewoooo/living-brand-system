/**
 * 검수 API 클라이언트 서비스 — 브라우저에서 /api/check 계열 호출의 요청/응답 계약을 소유한다.
 * 서버 판정·세션 저장은 API route 뒤의 start-check-session service가 담당하고,
 * 화면 상태(진행/완료 표시)는 CheckImageProvider가 담당한다.
 */
import type { CheckResult } from '@/features/asset-check/checkers/types'

export interface SubmitCheckResult {
	checkSessionId: number
	results: Record<string, CheckResult>
	pendingRuleKeys: string[]
}

/** 즉시(deterministic/advisory) 판정을 요청한다. AI 룰은 pendingRuleKeys로 분리돼 돌아온다. */
export async function submitCheck(file: File, scenarioKey: string): Promise<SubmitCheckResult> {
	const form = new FormData()
	form.append('image', file)
	form.append('scenarioKey', scenarioKey)
	form.append('source', 'review-page')
	const response = await fetch('/api/check', { method: 'POST', body: form })
	if (!response.ok) throw new Error(`check failed: ${response.status}`)
	return (await response.json()) as SubmitCheckResult
}

/** 첫 응답에서 분리된 AI(heuristic) 룰의 후속 판정을 요청한다. */
export async function submitAiCheck(
	file: File,
	checkSessionId: number,
	ruleKeys: string[],
): Promise<Record<string, CheckResult>> {
	const form = new FormData()
	form.append('image', file)
	form.append('checkSessionId', String(checkSessionId))
	form.append('ruleKeys', JSON.stringify(ruleKeys))
	const response = await fetch('/api/check/ai', { method: 'POST', body: form })
	if (!response.ok) throw new Error(`ai check failed: ${response.status}`)
	const { results } = (await response.json()) as { results: Record<string, CheckResult> }
	return results
}

/** AI 검수 실패 시 해당 룰들을 "담당자 검토 필요"로 채우는 폴백 결과. */
export function aiFailureResults(ruleKeys: string[]): Record<string, CheckResult> {
	const detail = 'AI 평가 실패'
	return Object.fromEntries(
		ruleKeys.map((key) => [
			key,
			{
				rule: { key, title: key, executor: 'heuristic' },
				checker: { key: 'ai', type: 'ai' },
				rawResult: { status: 'needs_review', fulfillment: null, detail },
				message: detail,
			} satisfies CheckResult,
		]),
	)
}
