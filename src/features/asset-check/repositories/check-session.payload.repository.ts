import config from '@payload-config'
import { getPayload } from 'payload'
import {
	CheckSession,
	type CheckSessionInputSnapshot,
} from '@/features/asset-check/domain/check-session'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckSessionSource } from '@/features/asset-check/types'
import type { AgentChatSession, User } from '@/payload-types'

interface CreateCheckSessionInput {
	agentChatSessionId?: AgentChatSession['id']
	source: CheckSessionSource
	imageName?: string
	rulesetSnapshot?: RuntimeCheck[]
	inputSnapshot: CheckSessionInputSnapshot
	user: User
}

/**
 * CheckSession 저장 repository — Aggregate ↔ Payload 레코드 변환과 Local API 쓰기를 소유한다.
 * 세션은 항상 running으로 시작하고, 이후 전이는 CheckSession Aggregate가 소유한다.
 */
export async function createCheckSessionRecord(
	input: CreateCheckSessionInput,
): Promise<CheckSession> {
	const payload = await getPayload({ config })
	const record = await payload.create({
		collection: 'check-sessions',
		data: {
			source: input.source,
			status: 'running',
			targetType: 'uploaded-image',
			imageName: input.imageName,
			inputSha256: input.inputSnapshot.sha256,
			inputMediaType: input.inputSnapshot.mediaType,
			inputByteLength: input.inputSnapshot.byteLength,
			rulesetSnapshot: input.rulesetSnapshot,
			pendingCheckKeys: [],
			agentChatSession: input.agentChatSessionId,
			createdBy: input.user.id,
		},
		// 서버 use case가 상태와 createdBy를 고정한 trusted write다.
		overrideAccess: true,
		user: input.user,
	})

	return CheckSession.fromRecord(record)
}

/**
 * CheckSession 단건 조회 repository — 저장 레코드를 Aggregate로 복원해 돌려준다.
 */
export async function getCheckSessionRecord(id: number, user: User): Promise<CheckSession | null> {
	const payload = await getPayload({ config })
	const result = await payload.find({
		collection: 'check-sessions',
		limit: 1,
		overrideAccess: true,
		user,
		where: {
			and: [{ id: { equals: id } }, { createdBy: { equals: user.id } }],
		},
	})
	const record = result.docs[0]

	return record ? CheckSession.fromRecord(record) : null
}

/**
 * CheckSession 저장 repository — Aggregate의 현재 상태를 기록한다.
 * 저장 필드 선택은 Aggregate의 toUpdateData()가 소유한다.
 */
export async function saveCheckSessionRecord(session: CheckSession, user: User): Promise<void> {
	const payload = await getPayload({ config })
	await payload.update({
		collection: 'check-sessions',
		id: session.id,
		data: session.toUpdateData(),
		overrideAccess: true,
		user,
	})
}
