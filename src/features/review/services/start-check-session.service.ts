import {
	type CheckSessionSource,
	createCheckSessionRecord,
} from '@/features/review/repositories/check-session.payload.repository'
import {
	filterRulesetByScenario,
	getReviewScenario,
} from '@/features/review/scenarios/review-scenarios'
import { getReviewRuleset } from '@/features/review/services/get-review-ruleset.service'
import { runReviewService } from '@/features/review/services/run-review.service'
import type { ImageContentFlags } from '@/features/review/types/content-flags'
import type { User } from '@/payload-types'

interface StartCheckSessionInput {
	buffer: Buffer
	flags: ImageContentFlags
	imageName?: string
	scenarioKey?: string
	source: CheckSessionSource
	user: User
}

/**
 * 검수 세션 시작 유스케이스 — 입력 이미지 판정과 CheckSession 저장을 한 요청 경계로 묶는다.
 */
export async function startCheckSessionService(input: StartCheckSessionInput) {
	const scenario = getReviewScenario(input.scenarioKey)
	const rulesetSnapshot = filterRulesetByScenario(await getReviewRuleset(), scenario)

	try {
		const results = await runReviewService(input.buffer, input.flags, rulesetSnapshot)
		const session = await createCheckSessionRecord({
			source: input.source,
			status: 'completed',
			imageName: input.imageName,
			rulesetSnapshot,
			results,
			user: input.user,
		})

		return { checkSessionId: session.id, results }
	} catch (error) {
		await createCheckSessionRecord({
			source: input.source,
			status: 'failed',
			imageName: input.imageName,
			rulesetSnapshot,
			errorMessage: error instanceof Error ? error.message : 'Review failed.',
			user: input.user,
		})
		throw error
	}
}
