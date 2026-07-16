import type { CheckStatus, RawCheckResult } from '@/features/asset-check/checkers/types'

/** 표시 전용 상태 — 저장 status에 더해, 전 기준 해당 없음(pass + not_applicable)을 별도 배지로 구분한다. */
export type CheckDisplayStatus = CheckStatus | 'not_applicable'

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
		pill: 'bg-primary/15 text-primary',
		dot: 'bg-primary',
	},
	ok: {
		label: '적합',
		pill: 'bg-secondary text-secondary-foreground',
		dot: 'bg-secondary-foreground',
	},
	advisory: {
		label: '조언',
		pill: 'bg-secondary text-secondary-foreground',
		dot: 'bg-secondary-foreground',
	},
	not_applicable: {
		label: '해당 없음',
		pill: 'bg-muted text-muted-foreground',
		dot: 'bg-muted-foreground',
	},
	needs_review: {
		label: '검토',
		pill: 'bg-accent text-accent-foreground',
		dot: 'bg-accent-foreground',
	},
	fail: {
		label: '미통과',
		pill: 'bg-destructive/15 text-destructive',
		dot: 'bg-destructive',
	},
}

/** 저장 결과 → 표시 상태. 전 기준 해당 없음인 pass만 not_applicable로 구분한다. */
export function checkDisplayStatus(
	rawResult: Pick<RawCheckResult, 'status' | 'reasonCode'>,
): CheckDisplayStatus {
	return rawResult.status === 'pass' && rawResult.reasonCode === 'not_applicable'
		? 'not_applicable'
		: rawResult.status
}
