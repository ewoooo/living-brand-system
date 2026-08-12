import type { CmykIccProfile } from './export-contract'

export const DEFAULT_CMYK_ICC_PROFILE = 'cgats21-crpc6' satisfies CmykIccProfile

export function isCmykIccProfile(value: unknown): value is CmykIccProfile {
	return value === 'cgats21-crpc6'
}
