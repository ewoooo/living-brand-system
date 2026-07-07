import type { RawCheckResult } from '@/features/asset-check/checkers/types'

export function renderCheckMessage(pattern: string | undefined, result: RawCheckResult): string {
	if (!pattern) return result.detail
	return pattern.replace(/\{([^}]+)\}/g, (_match, path: string) =>
		String(readPath(result, path.trim()) ?? ''),
	)
}

function readPath(value: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((current, key) => {
		if (!current || typeof current !== 'object') return undefined
		const next = (current as Record<string, unknown>)[key]
		return Array.isArray(next) ? next.join(', ') : next
	}, value)
}
