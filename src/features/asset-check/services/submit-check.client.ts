/**
 * 검수 API 클라이언트 서비스 — 브라우저에서 /api/check 계열 호출의 요청/응답 계약을 소유한다.
 * 서버 판정·세션 저장은 API route 뒤의 start-check-session service가 담당하고,
 * 화면 상태(진행/완료 표시)는 CheckImageProvider가 담당한다.
 */
import type { CheckResult } from '@/features/asset-check/checkers/types'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'

export interface SubmitCheckResult {
	checkSessionId: number
	results: Record<string, CheckResult>
	pendingCheckKeys: string[]
	rulesetSnapshot: RuntimeCheck[]
}

/** 즉시(deterministic/manual) 판정을 요청한다. AI Check는 pendingCheckKeys로 분리돼 돌아온다. */
export async function submitCheck(file: File, scenarioKey: string): Promise<SubmitCheckResult> {
	const form = new FormData()
	form.append('image', file)
	form.append('scenarioKey', scenarioKey)
	form.append('source', 'review-page')
	const response = await fetch('/api/check', { method: 'POST', body: form })
	if (!response.ok) throw new Error(`check failed: ${response.status}`)
	return (await response.json()) as SubmitCheckResult
}

/** 첫 응답에서 분리된 AI(heuristic) 룰의 후속 판정을 요청한다. 대상 룰은 서버가 세션에서 읽는다. */
export async function submitAiCheck(
	file: File,
	checkSessionId: number,
): Promise<Record<string, CheckResult>> {
	const form = new FormData()
	form.append('image', file)
	form.append('checkSessionId', String(checkSessionId))
	const response = await fetch('/api/check/ai', { method: 'POST', body: form })
	if (!response.ok) throw new Error(`ai check failed: ${response.status}`)
	const { results } = (await response.json()) as { results: Record<string, CheckResult> }
	return results
}

export interface RunFullCheckCallbacks {
	/** 서버 즉시 판정 결과. pendingCheckKeys가 남으면 AI 후속 판정이 이어진다. */
	onServerResult: (result: SubmitCheckResult) => void
	/** AI 후속 판정 결과(실패 시 폴백). checkSessionId로 어느 검수 세션의 결과인지 식별한다. */
	onAiResult: (checkSessionId: number, results: Record<string, CheckResult>) => void
}

/**
 * 한 이미지의 검수 흐름을 순서대로 실행한다: 서버 즉시 판정 → (남은 AI 룰이 있으면)
 * AI 후속 판정(실패 시 폴백). 요청 순서와 폴백은 이 서비스가 소유하고,
 * 화면 상태 반영은 콜백을 받은 호출자(CheckImageProvider)가 담당한다.
 * 서버 즉시 판정 실패는 그대로 throw하며, 호출자가 실패 상태로 반영한다.
 */
export async function runFullCheck(
	file: File,
	scenarioKey: string,
	{ onServerResult, onAiResult }: RunFullCheckCallbacks,
): Promise<void> {
	const serverResult = await submitCheck(file, scenarioKey)
	onServerResult(serverResult)

	if (serverResult.pendingCheckKeys.length === 0) return

	const aiResults = await submitAiCheck(file, serverResult.checkSessionId).catch(() =>
		aiFailureResults(serverResult.pendingCheckKeys),
	)
	onAiResult(serverResult.checkSessionId, aiResults)
}

/** AI 검수 실패 시 해당 룰들을 "담당자 검토 필요"로 채우는 폴백 결과. */
function aiFailureResults(checkKeys: string[]): Record<string, CheckResult> {
	const detail = 'AI 평가 실패'
	return Object.fromEntries(
		checkKeys.map((key) => [
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
