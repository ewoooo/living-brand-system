import { describe, expect, it } from 'vitest'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import { planChecks } from './check-plan'

const heuristicCheck: RuntimeCheck = {
	key: 'heuristic',
	title: 'Heuristic check',
	checker: { key: 'ai-check', type: 'heuristic' },
	executor: 'heuristic',
	model: 'model',
	heuristicCriteria: [{ id: 'visible', question: '보이는가?', expected: 'present' }],
	implemented: true,
	evidence: '',
	referenceAssets: [],
}

const manualCheck: RuntimeCheck = {
	...heuristicCheck,
	key: 'manual',
	executor: 'manual',
	heuristicCriteria: undefined,
}

const deterministicCheck: RuntimeCheck = {
	...heuristicCheck,
	key: 'deterministic',
	executor: 'deterministic',
	model: undefined,
	heuristicCriteria: undefined,
	checkerKey: 'palette-compliance',
}

describe('planChecks', () => {
	it('model 있는 manual은 ai-advisory로 분류한다', () => {
		expect(planChecks([manualCheck])).toEqual([
			{ kind: 'ai-advisory', check: manualCheck, model: 'model' },
		])
	})

	it('model 없는 manual은 manual-review로 분류한다', () => {
		const check = { ...manualCheck, model: undefined }

		expect(planChecks([check])).toEqual([{ kind: 'manual-review', check }])
	})

	it('model과 criteria가 있는 heuristic은 ai-criteria로 분류한다', () => {
		expect(planChecks([heuristicCheck])).toEqual([
			{
				kind: 'ai-criteria',
				check: heuristicCheck,
				model: 'model',
				criteria: heuristicCheck.heuristicCriteria,
			},
		])
	})

	it('criteria 없는 heuristic은 model보다 먼저 invalid_criteria로 판정한다', () => {
		const check = { ...heuristicCheck, heuristicCriteria: [], model: undefined }

		expect(planChecks([check])).toEqual([
			{ kind: 'unrunnable', check, reasonCode: 'invalid_criteria' },
		])
	})

	it('criteria는 있지만 model 없는 heuristic은 ai_checker_invalid로 판정한다', () => {
		const check = { ...heuristicCheck, model: undefined }

		expect(planChecks([check])).toEqual([
			{ kind: 'unrunnable', check, reasonCode: 'ai_checker_invalid' },
		])
	})

	it('등록된 checker가 있는 deterministic은 실행 가능한 checker를 실어 분류한다', () => {
		const [plan] = planChecks([deterministicCheck])

		expect(plan).toMatchObject({
			kind: 'deterministic',
			check: deterministicCheck,
			checkerKey: 'palette-compliance',
		})
		expect(plan.kind === 'deterministic' && typeof plan.checker.run).toBe('function')
	})

	it('checker 미등록 deterministic은 checker_not_registered로 판정한다', () => {
		const unknownChecker = { ...deterministicCheck, checkerKey: 'no-such-checker' }
		const noChecker = { ...deterministicCheck, checkerKey: undefined }

		expect(planChecks([unknownChecker, noChecker])).toEqual([
			{ kind: 'unrunnable', check: unknownChecker, reasonCode: 'checker_not_registered' },
			{ kind: 'unrunnable', check: noChecker, reasonCode: 'checker_not_registered' },
		])
	})

	it('Check마다 정확히 하나의 plan을 같은 순서로 반환한다', () => {
		const checks = [deterministicCheck, manualCheck, heuristicCheck]

		const plans = planChecks(checks)

		expect(plans.map((plan) => plan.check.key)).toEqual([
			'deterministic',
			'manual',
			'heuristic',
		])
	})
})
