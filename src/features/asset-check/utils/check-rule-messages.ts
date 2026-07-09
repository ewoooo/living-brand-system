import type { CheckStatus } from '@/features/asset-check/checkers/types'
import type { Rule } from '@/payload-types'

export function toCheckRuleMessages(
	messages: Rule['messages'],
): Partial<Record<CheckStatus, string>> {
	if (!messages) return {}
	return {
		pass: messages.pass ?? undefined,
		ok: messages.ok ?? undefined,
		needs_review: messages.needsReview ?? undefined,
		fail: messages.fail ?? undefined,
	}
}
