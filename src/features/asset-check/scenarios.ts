import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import type { ImageContentFlags } from '@/features/asset-check/types'

export interface CheckScenario {
	key: string
	title: string
	checkKeys: string[]
}

export const INITIAL_CHECK_SCENARIOS: CheckScenario[] = [
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
	},
	{
		key: 'image-mood',
		title: '이미지 무드 검수',
		checkKeys: [
			'imagery.style',
			'imagery.photography.classification',
			'photography-ingredient-textures',
			'imagery-misuse',
			'imagery.ai.consistency',
			'color.usage',
		],
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
	},
]

export function getCheckScenario(scenarios: CheckScenario[], key?: string | null): CheckScenario {
	const fallback = scenarios.find((scenario) => scenario.key === 'quick') ?? scenarios[0]
	if (!fallback) throw new Error('발행된 CheckScenario가 없습니다.')
	const exact = scenarios.find((scenario) => scenario.key === key?.trim().toLowerCase())
	if (exact) return exact
	const normalizedKey = normalizeCheckScenarioKey(key)
	return scenarios.find((scenario) => scenario.key === normalizedKey) ?? fallback
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
