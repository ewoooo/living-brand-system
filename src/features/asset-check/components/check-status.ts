import type { CheckStatus } from '@/features/asset-check/checkers/types'

/**
 * 검수 판정 상태의 색·라벨 단일 소스.
 * 룰 테이블 pill과 요약 dot이 모두 여기서 파생돼 색이 어긋나지 않게 한다.
 * Tailwind가 동적 클래스를 purge하므로 전체 클래스 문자열을 그대로 담는다.
 */
export const CHECK_STATUS: Record<CheckStatus, { label: string; pill: string; dot: string }> = {
	pass: {
		label: '통과',
		pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
		dot: 'bg-emerald-500',
	},
	ok: {
		label: '적합',
		pill: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
		dot: 'bg-sky-500',
	},
	needs_review: {
		label: '검토',
		pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
		dot: 'bg-amber-500',
	},
	fail: {
		label: '미통과',
		pill: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
		dot: 'bg-rose-500',
	},
}
