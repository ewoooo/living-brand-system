import type { CheckStatus } from '@/features/asset-check/checkers/types'

interface CheckMessages {
	pass?: string | null
	ok?: string | null
	needsReview?: string | null
	fail?: string | null
}

export function toRuntimeCheckMessages(
	messages: CheckMessages | null | undefined,
): Partial<Record<CheckStatus, string>> {
	if (!messages) return {}
	return {
		pass: messages.pass ?? undefined,
		ok: messages.ok ?? undefined,
		needs_review: messages.needsReview ?? undefined,
		fail: messages.fail ?? undefined,
	}
}
