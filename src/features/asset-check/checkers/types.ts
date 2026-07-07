/**
 * Checker shared types — run-check service와 개별 checker 사이의 최소 실행 계약이다.
 * rule schema나 Payload 문서 타입은 여기에 들이지 않는다.
 */
import type { Rgb, Swatch } from '@/features/asset-check/checkers/color/palette-match'

/** 기준(expected) 대비 측정값(actual)을 분리해 실은 구조화 필드. */
export interface RuleMetric {
	expected: string
	actual: string
}

export type CheckExecutor = 'deterministic' | 'heuristic' | 'advisory'
export type CheckStatus = 'pass' | 'ok' | 'needs_review' | 'fail'
export type CheckFactValue = string | number | string[]

interface CheckResultBase {
	status: CheckStatus
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
	/** 기준/현재값 구조화 필드 (계산된 룰만; 에러 분기는 생략) */
	metric?: RuleMetric
	/** 룰 메시지 패턴이 참조할 수 있는 checker 계산 사실. */
	facts?: Record<string, CheckFactValue>
}

export interface AlgorithmCheckResult extends CheckResultBase {
	status: Exclude<CheckStatus, 'ok'>
}

export interface AiCheckResult extends CheckResultBase {
	status: CheckStatus
}

export type RawCheckResult = AlgorithmCheckResult | AiCheckResult

export interface CheckResultRule {
	key: string
	title: string
	executor: CheckExecutor
}

export interface CheckResultChecker {
	key: string
	type: 'algorithm' | 'ai' | 'advisory'
}

export interface CheckResult extends CheckResultBase {
	rule: CheckResultRule
	checker: CheckResultChecker
	rawResult: RawCheckResult
	message: string
	/** 기존 UI/API 호환 필드. rule.executor와 같은 값이다. */
	executor: CheckExecutor
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

/** checker 파일이 export하는 순수 판정 함수. ruleKey/message는 registry/service가 붙인다. */
export type AlgorithmChecker = (ctx: CheckerContext) => AlgorithmCheckResult
