import type { ImageContentFlags } from '@/features/review/types/content-flags'

/** 룰이 요소 종속이면 해당 플래그가 켜져 있을 때만 검수한다. */
export function shouldCheckRule(ruleKey: string, flags: ImageContentFlags): boolean {
	if (ruleKey.startsWith('logo.')) return flags.logo
	if (ruleKey.startsWith('typography.')) return flags.typography
	if (ruleKey.startsWith('illustration.')) return flags.illustration
	if (ruleKey.startsWith('imagery.')) return flags.photography
	return true
}
