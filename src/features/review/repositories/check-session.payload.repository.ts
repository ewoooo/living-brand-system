import config from '@payload-config'
import { getPayload } from 'payload'
import type { CheckResult } from '@/features/review/checkers/types'
import type { ReviewRule } from '@/features/review/services/get-review-ruleset.service'
import type { CheckSession, User } from '@/payload-types'

export type CheckSessionSource = CheckSession['source']

interface CreateCheckSessionInput {
	source: CheckSessionSource
	status: CheckSession['status']
	imageName?: string
	rulesetSnapshot?: ReviewRule[]
	results?: Record<string, CheckResult>
	errorMessage?: string
	user: User
}

interface UpdateCheckSessionInput {
	id: CheckSession['id']
	status: CheckSession['status']
	results?: Record<string, CheckResult>
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
			errorMessage: input.errorMessage,
			completedAt: input.status === 'running' ? undefined : new Date().toISOString(),
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
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
			errorMessage: input.errorMessage,
			completedAt: input.status === 'running' ? undefined : new Date().toISOString(),
		},
		overrideAccess: true,
		user: input.user,
	})
}
