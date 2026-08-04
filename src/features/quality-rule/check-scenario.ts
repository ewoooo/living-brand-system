export interface CheckScenario {
	key: string
	title: string
	checkKeys: string[]
}

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
