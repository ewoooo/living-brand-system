import scenarios from '@/features/review/scenarios/review-scenarios.json'
import type { ReviewSection } from '@/features/review/services/get-review-ruleset.service'
import type { ImageContentFlags } from '@/features/review/types'

export interface ReviewScenario {
	key: string
	title: string
	ruleKeys: string[]
	flags: ImageContentFlags
}

export const REVIEW_SCENARIOS = scenarios as ReviewScenario[]

export function getReviewScenario(key: string | null | undefined): ReviewScenario {
	return REVIEW_SCENARIOS.find((scenario) => scenario.key === key) ?? REVIEW_SCENARIOS[0]
}

export function filterRulesetByScenario(
	sections: ReviewSection[],
	scenario: ReviewScenario,
): ReviewSection[] {
	const keys = new Set(scenario.ruleKeys)
	return sections.flatMap((section) => {
		const rules = section.rules.filter((rule) => keys.has(rule.key))
		return rules.length ? [{ ...section, rules }] : []
	})
}
