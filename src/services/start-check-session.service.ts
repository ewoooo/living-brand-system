import type { CheckResult } from '@/features/asset-check/checkers/types'
import {
	createCheckSessionRecord,
	getCheckSessionRecord,
	updateCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import {
	type CheckScenario,
	getCheckScenario,
	getCheckScenarioFlags,
} from '@/features/asset-check/scenarios'
import {
	getRuntimeChecks,
	type RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'
import type { CheckSessionSource, ImageContentFlags } from '@/features/asset-check/types'
import type { AgentChatSession, CheckSession, User } from '@/payload-types'

interface StartCheckSessionInput {
	agentChatSessionId?: AgentChatSession['id']
	buffer: Buffer
	deferHeuristic?: boolean
	flags?: ImageContentFlags
	imageName?: string
	scenario?: CheckScenario
	scenarioKey?: string
	source: CheckSessionSource
	user: User
}

interface CompleteCheckSessionAiCheckInput {
	buffer: Buffer
	checkSessionId: CheckSession['id']
	checkKeys: string[]
	user: User
}

/**
 * 검수 세션 시작 유스케이스 — 기본은 전체 판정을 저장하고, 화면 요청은 AI 룰을 후속 처리로 분리한다.
 * CheckSession 저장 I/O는 check-session repository가, 룰 판정은 asset-check 기능의
 * run-check/get-check-rules service가 소유한다.
 */
export async function startCheckSession(input: StartCheckSessionInput) {
	const scenario =
		input.scenario ?? getCheckScenario(await getCheckScenarios(input.user), input.scenarioKey)
	const rulesetSnapshot = await getRuntimeChecks(scenario.checkKeys)
	const session = await createCheckSessionRecord({
		agentChatSessionId: input.agentChatSessionId,
		source: input.source,
		status: 'running',
		imageName: input.imageName,
		rulesetSnapshot,
		user: input.user,
	})

	try {
		const immediate = await runImmediateCheck(
			input.buffer,
			input.flags ?? getCheckScenarioFlags(scenario),
			rulesetSnapshot,
		)
		const aiCheck = input.deferHeuristic
			? { results: {} }
			: await runHeuristicCheck(input.buffer, immediate.pendingCheckKeys, rulesetSnapshot)
		const results = { ...immediate.results, ...aiCheck.results }
		const pendingCheckKeys = input.deferHeuristic ? immediate.pendingCheckKeys : []
		await updateCheckSessionRecord({
			id: session.id,
			status: pendingCheckKeys.length > 0 ? 'running' : 'completed',
			results,
			aiUsage: aiCheck.aiUsage,
			user: input.user,
		})

		return { checkSessionId: session.id, results, pendingCheckKeys, rulesetSnapshot }
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
		? (session.rulesetSnapshot as RuntimeCheck[])
		: undefined
	const aiCheck = await runHeuristicCheck(input.buffer, input.checkKeys, rulesetSnapshot)
	const results = {
		...((session.results ?? {}) as Record<string, CheckResult>),
		...aiCheck.results,
	}

	await updateCheckSessionRecord({
		id: session.id,
		status: 'completed',
		results,
		aiUsage: aiCheck.aiUsage,
		user: input.user,
	})

	return { checkSessionId: session.id, results: aiCheck.results }
}
