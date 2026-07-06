/**
 * Rule gate helper — 사용자가 표시한 포함 요소 플래그로 실행할 룰을 고른다.
 * 실제 판정은 하지 않고 run-review service의 checker 실행 여부만 결정한다.
 */
import type { ImageContentFlags } from '@/features/review/types/content-flags'

/** 룰이 요소 종속이면 해당 플래그가 켜져 있을 때만 검수한다. */
export function shouldCheckRule(ruleKey: string, flags: ImageContentFlags): boolean {
	if (ruleKey.startsWith('logo.')) return flags.logo
	if (ruleKey.startsWith('typography.')) return flags.typography
	if (ruleKey.startsWith('illustration.')) return flags.illustration
	if (ruleKey.startsWith('imagery.')) return flags.photography
	return true
}
