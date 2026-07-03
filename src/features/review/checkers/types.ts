import type { Rgb } from '@/features/review/color-check'

export type CheckStatus = 'pass' | 'fail' | 'unsupported' | 'manual'

/**
 * 기준(expected) 대비 측정값(actual)을 분리해 실은 구조화 필드.
 * 사람 친화 코멘터리(commentary.ts)가 문자열 파싱 없이 그대로 주입해 쓴다.
 */
export interface RuleMetric {
	expected: string
	actual: string
	label?: string
}

export interface RuleCheckResult {
	ruleKey: string
	tier: string
	status: CheckStatus
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
	/** 코멘터리 주입용 기준/현재값 (계산된 룰만; 에러 분기는 생략) */
	metric?: RuleMetric
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
	check: (
		ctx: CheckerContext,
	) => Pick<RuleCheckResult, 'status' | 'fulfillment' | 'detail' | 'metric'>
}
