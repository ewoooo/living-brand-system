import { Checkmark, Close, Idea, Warning } from '@carbon/icons-react'
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

/**
 * 파일 종합 판정(CheckImageVerdict)의 아이콘. 라벨과 색은 위 CHECK_STATUS를 그대로 쓰고
 * 여기서는 리스트 행에 그릴 글리프만 더한다.
 * 🔴 Figma는 advisory에 손바닥을 쓰지만 Carbon에 손 글리프가 없다 — 조언이라는 뜻이 남는
 * Idea(전구)로 대체했다.
 */
export const CHECK_VERDICT_ICON = {
	pass: Checkmark,
	advisory: Idea,
	needs_review: Warning,
	fail: Close,
} as const
