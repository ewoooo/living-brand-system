import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import type { ImageContentFlags } from '@/features/asset-check/types'
import type { CheckScenario } from '@/features/quality-rule/check-scenario'

export function getCheckScenarioFlags(scenario: CheckScenario): ImageContentFlags {
	const has = (...prefixes: string[]) =>
		scenario.checkKeys.some((key) => prefixes.some((prefix) => key.startsWith(prefix)))
	return {
		logo: has('logo.'),
		typography: has('typography.'),
		illustration: has('illustration.'),
		photography: has('imagery.', 'photography'),
	}
}

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
