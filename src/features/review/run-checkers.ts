import type { Rgb } from '@/features/review/color-check'
import { getAllCheckers } from '@/features/review/checkers/registry'

export interface RuleOutcome {
	status: 'pass' | 'fail'
	fulfillment: number | null
	detail: string
}

/**
 * 추출된 픽셀로 등록된 checker를 모두 실행해 ruleKey별 결과를 만든다 (순수).
 * checker가 없는 룰은 여기 결과에 없고, 화면에서 "미개발"로 표시된다.
 * 서버/클라이언트 공용 — 픽셀 추출 방식(sharp/canvas)만 호출부가 다르다.
 */
export function runCheckers(pixels: Rgb[]): Record<string, RuleOutcome> {
	const outcomes: Record<string, RuleOutcome> = {}
	for (const checker of getAllCheckers()) {
		const { status, fulfillment, detail } = checker.check({ pixels })
		outcomes[checker.ruleKey] = {
			status: status === 'pass' ? 'pass' : 'fail',
			fulfillment,
			detail,
		}
	}
	return outcomes
}
