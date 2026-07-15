import type { CheckStatus } from '@/features/asset-check/checkers/types'

/**
 * 검수 판정 상태의 색·라벨 단일 소스.
 * 룰 테이블 pill과 요약 dot이 모두 여기서 파생돼 색이 어긋나지 않게 한다.
 * Tailwind가 동적 클래스를 purge하므로 전체 클래스 문자열을 그대로 담는다.
 */
export const CHECK_STATUS: Record<CheckStatus, { label: string; pill: string; dot: string }> = {
	pass: {
		label: '통과',
		pill: 'bg-success/15 text-success',
		dot: 'bg-success',
	},
	ok: {
		label: '적합',
		pill: 'bg-info/15 text-info',
		dot: 'bg-info',
	},
	advisory: {
		label: '조언',
		pill: 'bg-info/15 text-info',
		dot: 'bg-info',
	},
	needs_review: {
		label: '검토',
		pill: 'bg-warning/15 text-warning',
		dot: 'bg-warning',
	},
	fail: {
		label: '미통과',
		pill: 'bg-destructive/15 text-destructive',
		dot: 'bg-destructive',
	},
}
