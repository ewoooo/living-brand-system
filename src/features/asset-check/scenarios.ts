import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import type { CheckScenario } from '@/features/quality-rule/check-scenario'

export function filterRulesetByScenario(
	sections: CheckSection[],
	scenario: CheckScenario,
): CheckSection[] {
	const keys = new Set(scenario.checkKeys)
	return sections.flatMap((section) => {
		const checks = section.checks.filter((check) => keys.has(check.key))
		return checks.length ? [{ ...section, checks }] : []
	})
}
