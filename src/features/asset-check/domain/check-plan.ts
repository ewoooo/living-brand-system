/**
 * CheckPlan IR — "이 Check를 어떻게 실행할 수 있는가" 판단을 세션당 한 번만 내린다.
 * 판단은 여기서 한 번, 하류(run-check service·start-check-session)는 plan kind를 기계적으로 소비한다.
 * 오래된 rulesetSnapshot의 model·criteria 누락(drift)도 이 단계가 흡수한다. 순수 분류이며 I/O가 없다.
 */
import { getChecker, type RegisteredChecker } from '@/features/asset-check/checkers/registry'
import type { HeuristicCriterion } from '@/features/asset-check/checkers/types'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'

/** Check 1건의 실행 방식 판정. 모든 Check는 정확히 하나의 plan을 받는다(전수 분류). */
export type CheckPlan =
	| {
			kind: 'deterministic'
			check: RuntimeCheck
			checkerKey: string
			/** plan 단계에서 등록 확인까지 끝낸 checker — 소비자는 null 재검사 없이 바로 실행한다. */
			checker: RegisteredChecker
	  }
	/** model 없는 manual — 담당자 확인(needs_review)으로 즉시 확정한다. */
	| { kind: 'manual-review'; check: RuntimeCheck }
	/** heuristic + model + criteria — 서버 AI가 관측하고 evaluator가 판정한다. */
	| { kind: 'ai-criteria'; check: RuntimeCheck; model: string; criteria: HeuristicCriterion[] }
	/** model 있는 manual — 서버 AI가 조언 문단만 생성한다. */
	| { kind: 'ai-advisory'; check: RuntimeCheck; model: string }
	/** 서버가 실행할 수 없는 Check — 사유는 기존 needs_review reasonCode 문자열 계약을 유지한다. */
	| { kind: 'unrunnable'; check: RuntimeCheck; reasonCode: NeedsReviewReasonCode }

/** 서버 모델 호출이 필요한 plan — runAiCheck가 받는 유일한 입력 형태다. */
export type AiCheckPlan = Extract<CheckPlan, { kind: 'ai-criteria' | 'ai-advisory' }>

// needs_review 사유 코드별 사용자 문구의 단일 소유자 — 판정·조립 경로 전체가 이 표만 참조한다.
export const NEEDS_REVIEW_DETAILS = {
	reference_asset_unavailable: '레퍼런스 이미지 불러오기 실패',
	invalid_criteria: 'Heuristic 판정 기준 없음',
	ai_checker_invalid: 'AI 검사 도구 설정 오류',
	ai_not_configured: 'AI 설정 없음',
	image_not_available: 'AI 평가용 이미지 없음',
	ai_output_invalid: 'AI 관측값 형식 오류',
	ai_request_failed: 'AI 평가 실패',
	checker_not_registered: 'Checker 미등록',
} as const

export type NeedsReviewReasonCode = keyof typeof NEEDS_REVIEW_DETAILS

/** 사유 코드 하나로 needs_review 원판정을 만든다. 문구는 NEEDS_REVIEW_DETAILS가 소유한다. */
export function needsReview(reasonCode: NeedsReviewReasonCode) {
	return {
		status: 'needs_review' as const,
		fulfillment: null,
		detail: NEEDS_REVIEW_DETAILS[reasonCode],
		reasonCode,
	}
}

/** Check 배열을 같은 순서·같은 개수의 plan 배열로 전수 분류한다. */
export function planChecks(checks: RuntimeCheck[]): CheckPlan[] {
	return checks.map(planCheck)
}

function planCheck(check: RuntimeCheck): CheckPlan {
	if (check.executor === 'manual') {
		return check.model
			? { kind: 'ai-advisory', check, model: check.model }
			: { kind: 'manual-review', check }
	}
	if (check.executor === 'heuristic') {
		// 기존 판정 순서 유지: criteria를 model보다 먼저 검사한다.
		if (!check.heuristicCriteria?.length) {
			return unrunnable(check, 'invalid_criteria')
		}
		if (!check.model) {
			return unrunnable(check, 'ai_checker_invalid')
		}
		return { kind: 'ai-criteria', check, model: check.model, criteria: check.heuristicCriteria }
	}
	const checker = check.checkerKey ? getChecker(check.checkerKey, check.options) : null
	return checker && check.checkerKey
		? { kind: 'deterministic', check, checkerKey: check.checkerKey, checker }
		: unrunnable(check, 'checker_not_registered')
}

function unrunnable(check: RuntimeCheck, reasonCode: NeedsReviewReasonCode): CheckPlan {
	return { kind: 'unrunnable', check, reasonCode }
}
