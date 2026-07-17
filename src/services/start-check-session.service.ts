import {
	type CheckSession,
	CheckSessionInputMismatchError,
	type CheckSessionInputSnapshot,
	CheckSessionNotFoundError,
	type CheckSessionSource,
	CheckSessionTerminalError,
} from '@/features/asset-check/domain/check-session'
import {
	createCheckSessionRecord,
	getCheckSessionRecord,
	saveCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import {
	type CheckScenario,
	getCheckScenario,
	getCheckScenarioFlags,
} from '@/features/asset-check/scenarios'
import { getRuntimeChecks } from '@/features/asset-check/services/get-check-ruleset.service'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'
import type { ImageContentFlags } from '@/features/asset-check/types'
import { detectCheckImageMediaType } from '@/features/asset-check/utils/image-format'
import type { AgentChatSession, User } from '@/payload-types'

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
	checkSessionId: number
	user: User
}

async function snapshotInput(buffer: Buffer): Promise<CheckSessionInputSnapshot> {
	const mediaType = detectCheckImageMediaType(buffer)
	if (!mediaType) throw new CheckSessionInputMismatchError('Unsupported check image input.')
	const digest = await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(buffer))

	return {
		sha256: Buffer.from(digest).toString('hex'),
		mediaType,
		byteLength: buffer.byteLength,
	}
}

/**
 * 검수 세션 시작 유스케이스 — 기본은 전체 판정을 저장하고, 화면 요청은 AI 룰을 후속 처리로 분리한다.
 * 상태 전이와 결과 병합은 CheckSession Aggregate가, 저장 I/O는 check-session repository가,
 * 룰 판정은 asset-check 기능의 run-check/get-check-rules service가 소유한다.
 */
export async function startCheckSession(input: StartCheckSessionInput) {
	const inputSnapshot = await snapshotInput(input.buffer)
	const scenario =
		input.scenario ?? getCheckScenario(await getCheckScenarios(input.user), input.scenarioKey)
	const rulesetSnapshot = await getRuntimeChecks(scenario.checkKeys)
	const session = await createCheckSessionRecord({
		agentChatSessionId: input.agentChatSessionId,
		source: input.source,
		imageName: input.imageName,
		rulesetSnapshot,
		inputSnapshot,
		user: input.user,
	})

	try {
		const immediate = await runImmediateCheck(
			input.buffer,
			input.flags ?? getCheckScenarioFlags(scenario),
			rulesetSnapshot,
		)
		session.applyImmediateResults(immediate)
		if (!input.deferHeuristic && session.pendingCheckKeys.length > 0) {
			const aiCheck = await runHeuristicCheck(
				input.buffer,
				session.pendingCheckKeys,
				rulesetSnapshot,
			)
			session.applyAiResults(aiCheck)
		}
		await saveCheckSessionRecord(session, input.user)

		return {
			checkSessionId: session.id,
			results: session.results,
			pendingCheckKeys: session.pendingCheckKeys,
			rulesetSnapshot,
		}
	} catch (error) {
		if (session.status === 'running') {
			session.fail(error instanceof Error ? error.message : 'Check failed.')
			await saveCheckSessionRecord(session, input.user)
		}
		throw error
	}
}

/**
 * 검수 세션 AI 완료 유스케이스 — 세션에 저장된 pendingCheckKeys로 heuristic 룰을 실행하고 병합한다.
 * 같은 입력으로 이미 완료된 세션은 저장 결과를 반환하고, 실패 세션은 종결 오류로 처리한다.
 * 소유자 제한 조회와 상태 저장 외부 I/O는 check-session repository가 소유한다.
 */
export async function completeCheckSessionAiCheck(input: CompleteCheckSessionAiCheckInput) {
	const session = await getCheckSessionRecord(input.checkSessionId, input.user)
	if (!session) throw new CheckSessionNotFoundError('Check session not found.')
	session.assertInputMatches(await snapshotInput(input.buffer))
	if (session.isCompleted) {
		return { checkSessionId: session.id, results: session.results }
	}
	if (session.isFailed) {
		throw new CheckSessionTerminalError('Check session already failed.')
	}

	try {
		const aiCheck = await runHeuristicCheck(
			input.buffer,
			session.pendingCheckKeys,
			session.rulesetSnapshot,
		)
		session.applyAiResults(aiCheck)
		await saveCheckSessionRecord(session, input.user)

		return { checkSessionId: session.id, results: aiCheck.results }
	} catch (error) {
		await persistAiCheckFailure(session, input.user, error)
		throw error
	}
}

async function persistAiCheckFailure(session: CheckSession, user: User, error: unknown) {
	let runningSession: CheckSession | null = session

	// 완료 상태 저장이 실패했다면 DB의 실제 상태를 다시 읽는다. 첫 update가 반영됐다면
	// completed를 보존하고, 반영되지 않아 running인 경우에만 failed로 종결한다.
	if (runningSession.status !== 'running') {
		try {
			runningSession = await getCheckSessionRecord(runningSession.id, user)
		} catch (readError) {
			attachPersistenceCause(error, readError)
			return
		}
	}
	if (runningSession?.status !== 'running') return

	runningSession.fail(error instanceof Error ? error.message : 'Check failed.')
	try {
		await saveCheckSessionRecord(runningSession, user)
	} catch (saveError) {
		attachPersistenceCause(error, saveError)
	}
}

function attachPersistenceCause(error: unknown, persistenceError: unknown) {
	if (!(error instanceof Error) || !Object.isExtensible(error)) return
	error.cause =
		error.cause === undefined
			? persistenceError
			: new AggregateError(
					[error.cause, persistenceError],
					'Check session failure persistence failed.',
				)
}
