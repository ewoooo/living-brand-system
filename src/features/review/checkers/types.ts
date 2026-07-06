/**
 * Checker shared types — run-review service와 개별 checker 사이의 최소 실행 계약이다.
 * rule schema나 Payload 문서 타입은 여기에 들이지 않는다.
 */
import type { Rgb, Swatch } from '@/features/review/checkers/color/palette-match'

/** 기준(expected) 대비 측정값(actual)을 분리해 실은 구조화 필드. */
export interface RuleMetric {
	expected: string
	actual: string
}

/** 검수 결과. 자동 판정 외 executor 분기도 같은 shape로 저장한다. */
export interface CheckResult {
	status: 'pass' | 'fail' | 'needs_ai' | 'needs_review'
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
	/** 기준/현재값 구조화 필드 (계산된 룰만; 에러 분기는 생략) */
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
	palette: Swatch[]
	image?: {
		data: Buffer
		mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
	}
	/** 기하가 필요한 checker(로고 등)만 사용. color checker는 무시. */
	grid?: PixelGrid
}

/** 한 RuleSpec의 검수 실행기. registry에 key로 등록한다. */
export interface RuleChecker {
	ruleKey: string
	check: (ctx: CheckerContext) => CheckResult
}
