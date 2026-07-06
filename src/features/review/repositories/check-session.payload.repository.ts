import config from '@payload-config'
import { getPayload } from 'payload'
import type { CheckResult } from '@/features/review/checkers/types'
import type { ReviewSection } from '@/features/review/services/get-review-ruleset.service'
import type { CheckSession, User } from '@/payload-types'

export type CheckSessionSource = CheckSession['source']

interface CreateCheckSessionInput {
	source: CheckSessionSource
	status: CheckSession['status']
	imageName?: string
	rulesetSnapshot?: ReviewSection[]
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
			completedAt: new Date().toISOString(),
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
	})
}
