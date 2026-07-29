import type { CheckDisplayStatus } from '@/features/asset-check/utils/check-display-status'

/**
 * 검수 판정 상태의 색·라벨 단일 소스.
 * 룰 테이블 pill과 요약 dot이 모두 여기서 파생돼 색이 어긋나지 않게 한다.
 * Tailwind가 동적 클래스를 purge하므로 전체 클래스 문자열을 그대로 담는다.
 */
export const CHECK_STATUS: Record<
	CheckDisplayStatus,
	{ label: string; pill: string; dot: string }
> = {
	pass: {
		label: '통과',
		pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		dot: 'bg-emerald-600 dark:bg-emerald-400',
	},
	ok: {
		label: '적합',
		pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		dot: 'bg-emerald-600 dark:bg-emerald-400',
	},
	advisory: {
		label: '조언',
		pill: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
		dot: 'bg-sky-600 dark:bg-sky-400',
	},
	not_applicable: {
		label: '해당 없음',
		pill: 'bg-muted text-muted-foreground',
		dot: 'bg-muted-foreground',
	},
	needs_review: {
		label: '검토',
		pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		dot: 'bg-amber-600 dark:bg-amber-400',
	},
	fail: {
		label: '미통과',
		pill: 'bg-destructive/15 text-destructive',
		dot: 'bg-destructive',
	},
}
