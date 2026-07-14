import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import type { ImageContentFlags } from '@/features/asset-check/types'

export interface CheckScenario {
	key: string
	title: string
	checkKeys: string[]
	flags: ImageContentFlags
}

export const CHECK_SCENARIOS: CheckScenario[] = [
	{
		key: 'quick',
		title: '빠른 기본 검수',
		checkKeys: [
			'color.palette',
			'color.combination',
			'color.contrast',
			'logo.size.minimum',
			'logo.space.clear',
		],
		flags: { logo: true, typography: false, illustration: false, photography: false },
	},
	{
		key: 'image-mood',
		title: '이미지 무드 검수',
		checkKeys: [
			'imagery.style',
			'imagery.photography.classification',
			'imagery.misuse',
			'imagery.ai.consistency',
			'color.usage',
		],
		flags: { logo: false, typography: false, illustration: false, photography: true },
	},
	{
		key: 'sns',
		title: 'SNS 콘텐츠 검수',
		checkKeys: [
			'application.sns.format',
			'layout.sns.template',
			'layout.sns.zones',
			'application.sns.caption.legibility',
			'logo.sns.placement',
			'imagery.sns.classification',
			'messaging.sns.copy',
		],
		flags: { logo: true, typography: false, illustration: false, photography: true },
	},
	{
		key: 'web-visual',
		title: '웹/비주얼 템플릿 검수',
		checkKeys: [
			'application.web',
			'color.palette',
			'color.combination',
			'color.contrast',
			'typography.usage',
		],
		flags: { logo: false, typography: true, illustration: false, photography: false },
	},
	{
		key: 'advertisement',
		title: '광고 검수',
		checkKeys: [
			'application.advertisement.format',
			'layout.advertisement.template',
			'layout.advertisement.zones',
			'imagery.advertisement.classification',
			'messaging.advertisement.tagline',
			'messaging.advertisement.copy',
			'messaging.advertisement.boilerplate',
			'spacing.advertisement.scale',
			'color.palette',
		],
		flags: { logo: false, typography: false, illustration: false, photography: true },
	},
	{
		key: 'stationery',
		title: '명함/스테이셔너리 검수',
		checkKeys: [
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
	const normalizedKey = normalizeCheckScenarioKey(key)
	return CHECK_SCENARIOS.find((scenario) => scenario.key === normalizedKey) ?? CHECK_SCENARIOS[0]
}

function normalizeCheckScenarioKey(key: string | null | undefined): string | undefined {
	if (!key) return undefined
	const normalized = key.trim().toLowerCase()
	if (normalized === 'stationary') return 'stationery'
	if (normalized.includes('명함')) return 'stationery'
	if (normalized.includes('business') && normalized.includes('card')) return 'stationery'
	if (normalized.includes('name') && normalized.includes('card')) return 'stationery'
	if (normalized.includes('sns') || normalized.includes('social')) return 'sns'
	if (normalized.includes('web') || normalized.includes('visual')) return 'web-visual'
	if (normalized.includes('ad') || normalized.includes('advert')) return 'advertisement'
	if (normalized.includes('광고')) return 'advertisement'
	return normalized
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
