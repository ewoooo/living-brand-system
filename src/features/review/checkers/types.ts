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

export interface CheckerContext {
	pixels: Rgb[]
}

/** 한 RuleSpec의 검수 실행기. registry에 key로 등록한다. */
export interface RuleChecker {
	ruleKey: string
	check: (
		ctx: CheckerContext,
	) => Pick<RuleCheckResult, 'status' | 'fulfillment' | 'detail'>
}
