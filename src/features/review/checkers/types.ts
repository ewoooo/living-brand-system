import type { Rgb } from '@/features/review/color-check'

export type CheckStatus = 'pass' | 'fail' | 'unsupported' | 'manual'

export interface RuleCheckResult {
	ruleKey: string
	tier: string
	status: CheckStatus
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
}

/**
 * 2D 픽셀 그리드 (row-major, 길이 = width*height). 색만 보는 color 검수와 달리
 * 로고 검수는 위치·bbox·이웃이 필요해 기하를 보존한다. alpha로 투명 배경을 구분한다.
 */
export interface PixelGrid {
	width: number
	height: number
	pixels: Rgb[]
	alpha: Uint8Array
}

export interface CheckerContext {
	pixels: Rgb[]
	/** 기하가 필요한 checker(로고 등)만 사용. color checker는 무시. */
	grid?: PixelGrid
}

/** 한 RuleSpec의 검수 실행기. registry에 key로 등록한다. */
export interface RuleChecker {
	ruleKey: string
	check: (ctx: CheckerContext) => Pick<RuleCheckResult, 'status' | 'fulfillment' | 'detail'>
}
