import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import type { ImageContentFlags } from '@/features/asset-check/types'

export interface CheckScenario {
	key: string
	title: string
	ruleKeys: string[]
	flags: ImageContentFlags
}

export const CHECK_SCENARIOS: CheckScenario[] = [
	{
		key: 'quick',
		title: '빠른 기본 검수',
		ruleKeys: ['color.palette', 'color.combination', 'logo.size.minimum', 'logo.space.clear'],
		flags: { logo: true, typography: false, illustration: false, photography: false },
	},
	{
		key: 'image-mood',
		title: '이미지 무드 검수',
		ruleKeys: ['imagery.style', 'imagery.photography.classification', 'color.usage'],
		flags: { logo: false, typography: false, illustration: false, photography: true },
	},
	{
		key: 'stationery',
		title: '명함/스테이셔너리 검수',
		ruleKeys: [
			'application.stationery.format',
			'application.print.spec',
			'color.palette',
			'typography.usage',
			'typography.family',
			'typography.weight',
			'typography.misuse',
		],
		flags: { logo: true, typography: true, illustration: false, photography: false },
	},
]

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
