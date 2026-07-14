import { describe, expect, it } from 'vitest'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import { toDeterministicCheckResult } from './check-result.adapter'
import { contrastChecker, contrastOptionsSchema } from './contrast.checker'
import { evaluateExtraction, evaluateMeasurement } from './deterministic-evaluator'
import type { ColorPairObservation, ExtractionResult } from './types'

const validOptions = {
	criteria: [{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 }],
} as const

describe('contrast options contract', () => {
	it('accepts one minimum contrast criterion', () => {
		expect(contrastOptionsSchema.safeParse(validOptions).success).toBe(true)
	})

	it('rejects out-of-range values and unknown keys', () => {
		expect(
			contrastOptionsSchema.safeParse({
				criteria: [{ measurement: 'contrastRatio', operator: 'gte', expected: 22 }],
			}).success,
		).toBe(false)
		expect(
			contrastOptionsSchema.safeParse({ ...validOptions, extractorKey: 'custom' }).success,
		).toBe(false)
	})
})

describe('deterministic evaluator contract', () => {
	it('compares measurements with criteria and calculates fulfillment', () => {
		const pass = evaluateMeasurement(
			{ state: 'measured', measurements: { contrastRatio: 4.5 } },
			validOptions.criteria,
		)
		const fail = evaluateMeasurement(
			{ state: 'measured', measurements: { contrastRatio: 3.8 } },
			validOptions.criteria,
		)

		expect(pass).toMatchObject({
			status: 'pass',
			fulfillment: 100,
			comparisons: [{ actual: 4.5, satisfied: true }],
		})
		expect(fail).toMatchObject({
			status: 'fail',
			fulfillment: 0,
			comparisons: [{ actual: 3.8, satisfied: false }],
		})
	})

	it('returns needs_review when a required measurement is missing', () => {
		expect(
			evaluateMeasurement({ state: 'measured', measurements: {} }, validOptions.criteria),
		).toMatchObject({
			status: 'needs_review',
			fulfillment: null,
			reasonCode: 'missing_measurement',
		})
	})
})

describe('Contrast Checker measurement contract', () => {
	it('measures black and white as a 21:1 contrast ratio without deciding status', () => {
		const result = contrastChecker({
			kind: 'color-pair',
			foreground: { r: 0, g: 0, b: 0 },
			background: { r: 255, g: 255, b: 255 },
		})

		expect(result).toMatchObject({
			state: 'measured',
			measurements: { contrastRatio: 21 },
		})
		expect('status' in result).toBe(false)
	})
})

describe('deterministic CheckResult integration', () => {
	it('maps extractor failure to a needs_review CheckResult', () => {
		const extraction: ExtractionResult<ColorPairObservation> = {
			state: 'not_extractable',
			reasonCode: 'color_pair_not_found',
		}
		const evaluation = evaluateExtraction(extraction, contrastChecker, validOptions.criteria)
		const result = toDeterministicCheckResult(evaluation, runtimeCheck(), 'contrast')

		expect(result).toMatchObject({
			rule: { key: 'typography.contrast', executor: 'deterministic' },
			checker: { key: 'contrast', type: 'algorithm' },
			rawResult: {
				status: 'needs_review',
				fulfillment: null,
				reasonCode: 'color_pair_not_found',
			},
			message: '자동 판정 보류: color_pair_not_found',
		})
	})
})

function runtimeCheck(): RuntimeCheck {
	return {
		key: 'typography.contrast',
		title: 'Typography Contrast',
		checker: { key: 'contrast', type: 'deterministic', implementationKey: 'contrast' },
		executor: 'deterministic',
		checkerKey: 'contrast',
		options: validOptions,
		implemented: true,
		evidence: 'Text must remain readable.',
		referenceAssets: [],
		messages: { needs_review: '자동 판정 보류: {reasonCode}' },
	}
}
