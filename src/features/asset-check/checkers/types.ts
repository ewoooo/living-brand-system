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

interface CheckAlgorithmResultBase {
	status: CheckStatus
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
	/** 기준/현재값 구조화 필드 (계산된 룰만; 에러 분기는 생략) */
	metric?: RuleMetric
	/** 룰 메시지 패턴이 참조할 수 있는 checker 계산 사실. */
	facts?: Record<string, CheckFactValue>
}

export interface DeterministicAlgorithmResult extends CheckAlgorithmResultBase {
	status: Exclude<CheckStatus, 'ok'>
}

export interface HeuristicAlgorithmResult extends CheckAlgorithmResultBase {}

export interface AdvisoryAlgorithmResult extends CheckAlgorithmResultBase {
	status: 'needs_review'
	fulfillment: null
}

export type CheckAlgorithmResult =
	| DeterministicAlgorithmResult
	| HeuristicAlgorithmResult
	| AdvisoryAlgorithmResult

export interface DeterministicCheckResult extends DeterministicAlgorithmResult {
	executor: 'deterministic'
}

export interface HeuristicCheckResult extends HeuristicAlgorithmResult {
	executor: 'heuristic'
}

export interface AdvisoryCheckResult extends AdvisoryAlgorithmResult {
	executor: 'advisory'
}

export type CheckRunResult = DeterministicCheckResult | HeuristicCheckResult | AdvisoryCheckResult

/** 현재 API/UI 호환 이름. 점진적으로 CheckRunResult/CheckRuleResult로 좁힌다. */
export type CheckResult = CheckRunResult

export interface CheckRuleResult {
	ruleKey: string
	checkerKey?: string
	executor: CheckExecutor
	status: CheckStatus
	fulfillment: number | null
	detail: string
	metric?: RuleMetric
	facts?: Record<string, CheckFactValue>
	run: CheckRunResult
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
	check: (ctx: CheckerContext) => DeterministicAlgorithmResult
}
