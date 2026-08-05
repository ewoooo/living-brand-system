export interface CheckScenario {
	key: string
	title: string
	checkKeys: string[]
	aliases?: string[]
}

export function getCheckScenario(scenarios: CheckScenario[], key?: string | null): CheckScenario {
	const fallback = scenarios.find((scenario) => scenario.key === 'quick') ?? scenarios[0]
	if (!fallback) throw new Error('발행된 CheckScenario가 없습니다.')
	const normalized = key?.trim().toLowerCase()
	if (!normalized) return fallback
	const exact = scenarios.find((scenario) => scenario.key === normalized)
	if (exact) return exact
	// 별칭은 공백으로 구분된 각 단어가 입력 키에 부분 문자열로 모두 포함되면 매칭된다.
	const aliased = scenarios.find((scenario) =>
		scenario.aliases?.some((alias) =>
			alias
				.trim()
				.toLowerCase()
				.split(/\s+/)
				.every((token) => normalized.includes(token)),
		),
	)
	return aliased ?? fallback
}
