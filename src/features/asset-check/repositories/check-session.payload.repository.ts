import config from '@payload-config'
import { getPayload } from 'payload'
import type { AiUsage, CheckResult } from '@/features/asset-check/checkers/types'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckSessionSource } from '@/features/asset-check/types'
import type { AgentChatSession, CheckSession, User } from '@/payload-types'

interface CreateCheckSessionInput {
	agentChatSessionId?: AgentChatSession['id']
	source: CheckSessionSource
	status: CheckSession['status']
	imageName?: string
	rulesetSnapshot?: RuntimeCheck[]
	results?: Record<string, CheckResult>
	aiUsage?: AiUsage
	errorMessage?: string
	user: User
}

interface UpdateCheckSessionInput {
	id: CheckSession['id']
	status: CheckSession['status']
	results?: Record<string, CheckResult>
	aiUsage?: AiUsage
	errorMessage?: string
	user: User
}

/**
 * CheckSession 저장 repository — 검수 실행 기록의 Payload Local API 쓰기를 소유한다.
 */
export async function createCheckSessionRecord(input: CreateCheckSessionInput) {
	const payload = await getPayload({ config })

	return payload.create({
		collection: 'check-sessions',
		data: {
			source: input.source,
			status: input.status,
			targetType: 'uploaded-image',
			imageName: input.imageName,
			rulesetSnapshot: input.rulesetSnapshot,
			results: input.results,
			agentChatSession: input.agentChatSessionId,
			aiUsage: input.aiUsage,
			errorMessage: input.errorMessage,
			completedAt: input.status === 'running' ? undefined : new Date().toISOString(),
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
	})
}

/**
 * CheckSession 단건 조회 repository — 후속 AI 검수가 기존 즉시 검수 결과와 룰셋을 이어받는다.
 */
export async function getCheckSessionRecord(id: CheckSession['id'], user: User) {
	const payload = await getPayload({ config })

	return payload.findByID({
		collection: 'check-sessions',
		id,
		overrideAccess: true,
		user,
	})
}

/**
 * CheckSession 상태 갱신 repository — 실행 중 세션의 완료/실패 결과 저장만 소유한다.
 */
export async function updateCheckSessionRecord(input: UpdateCheckSessionInput) {
	const payload = await getPayload({ config })

	return payload.update({
		collection: 'check-sessions',
		id: input.id,
		data: {
			status: input.status,
			results: input.results,
			aiUsage: input.aiUsage,
			errorMessage: input.errorMessage,
			completedAt: input.status === 'running' ? undefined : new Date().toISOString(),
		},
		overrideAccess: true,
		user: input.user,
	})
}
