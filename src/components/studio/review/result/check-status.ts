import type { CheckDisplayStatus } from '@/features/asset-check/utils/check-display-status'

type CheckStatusVariant = 'success' | 'info' | 'muted' | 'warning' | 'destructive'

/**
 * 검수 판정 상태의 색·라벨 단일 소스.
 * 룰 테이블 Badge variant와 요약 dot이 모두 여기서 파생돼 색이 어긋나지 않게 한다.
 * Tailwind가 동적 클래스를 purge하므로 전체 클래스 문자열을 그대로 담는다.
 */
export const CHECK_STATUS: Record<
	CheckDisplayStatus,
	{ label: string; variant: CheckStatusVariant; dot: string }
> = {
	pass: {
		label: '통과',
		variant: 'success',
		dot: 'bg-success',
	},
	ok: {
		label: '적합',
		variant: 'success',
		dot: 'bg-success',
	},
	advisory: {
		label: '조언',
		variant: 'info',
		dot: 'bg-info',
	},
	not_applicable: {
		label: '해당 없음',
		variant: 'muted',
		dot: 'bg-muted-foreground',
	},
	needs_review: {
		label: '검토',
		variant: 'warning',
		dot: 'bg-warning',
	},
	fail: {
		label: '미통과',
		variant: 'destructive',
		dot: 'bg-destructive',
	},
}
