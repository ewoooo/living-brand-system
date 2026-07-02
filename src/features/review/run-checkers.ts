import { getChecker } from '@/features/review/checkers/registry'
import type { PixelGrid } from '@/features/review/checkers/types'
import type { Rgb } from '@/features/review/color-check'

export interface RuleOutcome {
	status: 'pass' | 'fail' | 'pending'
	fulfillment: number | null
	detail: string
}

const PENDING: RuleOutcome = { status: 'pending', fulfillment: null, detail: '' }

/**
 * ruleKey 순서대로 하나씩 검수하며 각 결과를 콜백으로 흘려보낸다.
 * checker가 있으면 실제 판정(pass/fail), 없으면 pending(미개발).
 * staggerMs로 진행을 눈에 보이게 한다 (실제 계산은 빠르지만 사이클 진행 표시용).
 */
export async function runCheckersProgressive(
	pixels: Rgb[],
	grid: PixelGrid | undefined,
	ruleKeys: string[],
	onResult: (ruleKey: string, outcome: RuleOutcome) => void,
	staggerMs = 35,
): Promise<void> {
	for (const ruleKey of ruleKeys) {
		const checker = getChecker(ruleKey)
		if (checker) {
			const result = checker.check({ pixels, grid })
			onResult(ruleKey, {
				status: result.status === 'pass' ? 'pass' : 'fail',
				fulfillment: result.fulfillment,
				detail: result.detail,
			})
		} else {
			onResult(ruleKey, PENDING)
		}
		if (staggerMs > 0) await new Promise((resolve) => setTimeout(resolve, staggerMs))
	}
}
