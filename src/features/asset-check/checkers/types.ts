/**
 * 검수 실행 공용 타입 — run-check service와 판정 경로 사이의 실행 계약이다.
 * deterministic 계약(측정·기준 비교)과 AI 계약(AiCheckResult·HeuristicCriterion·AiUsage)을
 * 함께 소유한다. 두 경로가 같은 CheckResult로 수렴하므로 한 파일에 둔다.
 * rule schema나 Payload 문서 타입은 여기에 들이지 않는다.
 */

import type { CheckImageMediaType } from '@/features/asset-check/utils/image-format'
import type { Rgb, Swatch } from './palette-match'

/** 기준(expected) 대비 측정값(actual)을 분리해 실은 구조화 필드. */
export interface CheckMetric {
	expected: string
	actual: string
}

export type CheckExecutor = 'deterministic' | 'heuristic' | 'manual'
export type CheckStatus = 'pass' | 'ok' | 'advisory' | 'needs_review' | 'fail'
export type CheckFactValue = string | number | boolean | string[]
export type MeasurementValue = string | number | boolean
export type CriterionExpected = MeasurementValue | number[] | string[]
export type CriterionOperator = 'gte' | 'lte' | 'eq' | 'in' | 'within'

export interface DeterministicCriterion {
	measurement: string
	operator: CriterionOperator
	expected: CriterionExpected
	tolerance?: number
}

export interface CriterionComparison extends DeterministicCriterion {
	actual: MeasurementValue
	satisfied: boolean
}

export type MeasurementResult =
	| {
			state: 'measured'
			measurements: Record<string, MeasurementValue>
			facts?: Record<string, CheckFactValue>
	  }
	| {
			state: 'not_measurable'
			reasonCode: string
			facts?: Record<string, CheckFactValue>
	  }

export type ExtractionResult<Value> =
	| { state: 'extracted'; value: Value; confidence?: number }
	| { state: 'not_extractable'; reasonCode: string }

export interface ColorPairObservation {
	kind: 'color-pair'
	foreground: Rgb
	background: Rgb
	confidence?: number
}

export interface DeterministicEvaluationResult {
	status: Exclude<CheckStatus, 'ok' | 'advisory'>
	fulfillment: number | null
	comparisons: CriterionComparison[]
	measurements?: Record<string, MeasurementValue>
	facts?: Record<string, CheckFactValue>
	reasonCode?: string
}

export type DeterministicChecker<Input> = (
	input: Input,
	parameters?: Record<string, unknown>,
) => MeasurementResult

interface CheckResultBase {
	status: CheckStatus
	/** 충족률 % (계산 가능한 룰만, 아니면 null) */
	fulfillment: number | null
	detail: string
	/** 기준/현재값 구조화 필드 (계산된 룰만; 에러 분기는 생략) */
	metric?: CheckMetric
	/** 룰 메시지 패턴이 참조할 수 있는 checker 계산 사실. */
	facts?: Record<string, CheckFactValue>
	/** 정규화된 deterministic 측정과 기준 비교. 기존 결과에는 없을 수 있다. */
	measurements?: Record<string, MeasurementValue>
	comparisons?: CriterionComparison[]
	reasonCode?: string
}

export interface AlgorithmCheckResult extends CheckResultBase {
	status: Exclude<CheckStatus, 'ok' | 'advisory'>
}

export type HeuristicCriterion =
	| {
			id: string
			question: string
			/** 미지정은 presence — 기존 저장 데이터·스냅샷 호환 */
			kind?: 'presence'
			expected: 'present' | 'absent'
	  }
	| {
			id: string
			question: string
			kind: 'measure'
			operator: 'gte' | 'lte' | 'between'
			expected: number
			/** between 상한 */
			max?: number
			unit?: string
	  }

export interface AiCheckResult extends CheckResultBase {
	status: CheckStatus
	observations?: {
		criterionId: string
		question: string
		kind?: 'presence' | 'measure'
		expected: 'present' | 'absent' | number
		operator?: 'gte' | 'lte' | 'between'
		max?: number
		unit?: string
		actual: 'present' | 'absent' | 'uncertain' | 'not_applicable' | number
		confidence: number
		reason: string
		satisfied: boolean | null
	}[]
}

export interface AiUsage {
	model: string
	callCount?: number
	inputTokens?: number
	outputTokens?: number
	totalTokens?: number
	cacheReadInputTokens?: number
	cacheWriteInputTokens?: number
	reasoningTokens?: number
	rawUsage?: Record<string, unknown>
}

export type RawCheckResult = AlgorithmCheckResult | AiCheckResult

export interface CheckResultRule {
	key: string
	title: string
	executor: CheckExecutor
}

export interface CheckResultChecker {
	key: string
	type: 'algorithm' | 'ai' | 'manual'
}

/**
 * 룰 1건의 최종 검수 결과. rule(무엇을)·checker(누가)·rawResult(원판정)·message(사용자 문구)로
 * 나뉘며, status/fulfillment/detail 등은 rawResult 안에서만 읽는다 (평탄 사본을 두지 않는다).
 */
export interface CheckResult {
	rule: CheckResultRule
	checker: CheckResultChecker
	rawResult: RawCheckResult
	message: string
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
		mediaType: CheckImageMediaType
	}
	/** 기하가 필요한 checker(로고 등)만 사용. color checker는 무시. */
	grid?: PixelGrid
}

/** checker 파일이 export하는 순수 판정 함수. checkKey/message는 registry/service가 붙인다. */
export type AlgorithmChecker = (ctx: CheckerContext) => AlgorithmCheckResult
