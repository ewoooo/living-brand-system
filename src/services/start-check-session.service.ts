import type { CheckResult } from '@/features/asset-check/checkers/types'
import {
	type CheckSessionSource,
	createCheckSessionRecord,
	getCheckSessionRecord,
	updateCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import { getCheckScenario } from '@/features/asset-check/scenarios/check-scenarios'
import {
	type CheckRule,
	getCheckRules,
} from '@/features/asset-check/services/get-check-ruleset.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'
import type { ImageContentFlags } from '@/features/asset-check/types'
import type { CheckSession, User } from '@/payload-types'

// 시나리오 어휘는 scenarioKey 입력 계약의 일부다 — 다른 기능은 asset-check 내부 대신 여기서 가져간다.
export {
	CHECK_SCENARIOS,
	type CheckScenario,
	getCheckScenario,
} from '@/features/asset-check/scenarios/check-scenarios'

interface StartCheckSessionInput {
	buffer: Buffer
	deferHeuristic?: boolean
	flags: ImageContentFlags
	imageName?: string
	scenarioKey?: string
	source: CheckSessionSource
	user: User
}

interface CompleteCheckSessionAiCheckInput {
	buffer: Buffer
	checkSessionId: CheckSession['id']
	ruleKeys: string[]
	user: User
}

/**
 * 검수 세션 시작 유스케이스 — 기본은 전체 판정을 저장하고, 화면 요청은 AI 룰을 후속 처리로 분리한다.
 * CheckSession 저장 I/O는 check-session repository가, 룰 판정은 asset-check 기능의
 * run-check/get-check-rules service가 소유한다.
 */
export async function startCheckSession(input: StartCheckSessionInput) {
	const scenario = getCheckScenario(input.scenarioKey)
	const rulesetSnapshot = await getCheckRules(scenario.ruleKeys)
	const session = await createCheckSessionRecord({
		source: input.source,
		status: 'running',
		imageName: input.imageName,
		rulesetSnapshot,
		user: input.user,
	})

	try {
		const immediate = await runImmediateCheck(input.buffer, input.flags, rulesetSnapshot)
		const aiResults = input.deferHeuristic
			? {}
			: await runHeuristicCheck(input.buffer, immediate.pendingRuleKeys, rulesetSnapshot)
		const results = { ...immediate.results, ...aiResults }
		const pendingRuleKeys = input.deferHeuristic ? immediate.pendingRuleKeys : []
		await updateCheckSessionRecord({
			id: session.id,
			status: pendingRuleKeys.length > 0 ? 'running' : 'completed',
			results,
			user: input.user,
		})

		return { checkSessionId: session.id, results, pendingRuleKeys }
	} catch (error) {
		await updateCheckSessionRecord({
			id: session.id,
			status: 'failed',
			errorMessage: error instanceof Error ? error.message : 'Check failed.',
			user: input.user,
		})
		throw error
	}
}

/**
 * 검수 세션 AI 완료 유스케이스 — 첫 응답에서 분리한 heuristic 룰만 실행하고 기존 결과와 병합한다.
 * CheckSession 조회/저장은 repository가, AI 판정은 check service가 소유한다.
 */
export async function completeCheckSessionAiCheck(input: CompleteCheckSessionAiCheckInput) {
	const session = await getCheckSessionRecord(input.checkSessionId, input.user)
	const rulesetSnapshot = Array.isArray(session.rulesetSnapshot)
		? (session.rulesetSnapshot as CheckRule[])
		: undefined
	const aiResults = await runHeuristicCheck(input.buffer, input.ruleKeys, rulesetSnapshot)
	const results = {
		...((session.results ?? {}) as Record<string, CheckResult>),
		...aiResults,
	}

	await updateCheckSessionRecord({
		id: session.id,
		status: 'completed',
		results,
		user: input.user,
	})

	return { checkSessionId: session.id, results: aiResults }
}
