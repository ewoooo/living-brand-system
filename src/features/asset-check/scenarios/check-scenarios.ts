import scenarios from '@/features/asset-check/scenarios/check-scenarios.json'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import type { ImageContentFlags } from '@/features/asset-check/types'

export interface CheckScenario {
	key: string
	title: string
	ruleKeys: string[]
	flags: ImageContentFlags
}

export const CHECK_SCENARIOS = scenarios as CheckScenario[]

export function getCheckScenario(key: string | null | undefined): CheckScenario {
	return CHECK_SCENARIOS.find((scenario) => scenario.key === key) ?? CHECK_SCENARIOS[0]
}

export function filterRulesetByScenario(
	sections: CheckSection[],
	scenario: CheckScenario,
): CheckSection[] {
	const keys = new Set(scenario.ruleKeys)
	return sections.flatMap((section) => {
		const rules = section.rules.filter((rule) => keys.has(rule.key))
		return rules.length ? [{ ...section, rules }] : []
	})
}
