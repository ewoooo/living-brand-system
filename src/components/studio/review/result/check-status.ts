import type { CheckDisplayStatus } from '@/features/asset-check/utils/check-display-status'

type CheckStatusVariant = 'success' | 'info' | 'muted' | 'warning' | 'destructive'

/**
 * 검수 판정 상태의 색·라벨 단일 소스.
 * variant는 ui/badge.tsx의 cva variant 키이므로 Badge가 실제 클래스를 결정한다 — 여기서는 상태별
 * variant 키와 라벨만 데이터로 갖는다.
 */
export const CHECK_STATUS: Record<
	CheckDisplayStatus,
	{ label: string; variant: CheckStatusVariant }
> = {
	pass: {
		label: '통과',
		variant: 'success',
	},
	ok: {
		label: '적합',
		variant: 'success',
	},
	advisory: {
		label: '조언',
		variant: 'info',
	},
	not_applicable: {
		label: '해당 없음',
		variant: 'muted',
	},
	needs_review: {
		label: '검토',
		variant: 'warning',
	},
	fail: {
		label: '미통과',
		variant: 'destructive',
	},
}
