import { describe, expect, it, vi } from 'vitest'
import { extractPixelGrid } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { getCheckPalette } from '@/features/asset-check/services/get-check-palette.service'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import { toDeterministicCheckResult } from './check-result.adapter'
import { extractDominantColorPair } from './color-pair.extractor'
import { contrastChecker, contrastOptionsSchema } from './contrast.checker'
import { evaluateExtraction, evaluateMeasurement } from './deterministic.evaluator'
import { hasDeterministicChecker } from './registry'
import type { ColorPairObservation, ExtractionResult, PixelGrid } from './types'

vi.mock('@/features/asset-check/repositories/image-decoder.sharp.repository', () => ({
	extractPixelGrid: vi.fn(),
}))

vi.mock('@/features/asset-check/services/get-check-palette.service', () => ({
	getCheckPalette: vi.fn(),
}))

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

describe('ColorPair Extractor contract', () => {
	it('maps the two dominant raster colors to background and foreground', () => {
		expect(extractDominantColorPair(twoColorGrid())).toMatchObject({
			state: 'extracted',
			value: {
				kind: 'color-pair',
				background: { r: 255, g: 255, b: 255 },
				foreground: { r: 0, g: 0, b: 0 },
			},
		})
	})

	it('returns not_extractable when the raster has only one dominant color', () => {
		expect(extractDominantColorPair(solidGrid())).toEqual({
			state: 'not_extractable',
			reasonCode: 'color_pair_not_found',
		})
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

	// run-check.service 동적 import(payload 의존 체인)가 무거워 병렬 부하 시 기본 5초를 넘긴다
	it('runs registered Contrast extraction, measurement, evaluation, and adapter', {
		timeout: 15_000,
	}, async () => {
		vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/test')
		vi.stubEnv('PAYLOAD_SECRET', 'test-secret')
		vi.mocked(extractPixelGrid).mockResolvedValue(twoColorGrid())
		vi.mocked(getCheckPalette).mockResolvedValue([])
		const { runImmediateCheck } = await import(
			'@/features/asset-check/services/run-check.service'
		)

		const result = await runImmediateCheck(
			Buffer.from('test-image'),
			{ logo: false, typography: true, illustration: false, photography: false },
			[runtimeCheck()],
		)

		expect(hasDeterministicChecker('contrast')).toBe(true)
		expect(result.results['typography.contrast']).toMatchObject({
			rawResult: {
				status: 'pass',
				fulfillment: 100,
				measurements: { contrastRatio: 21 },
				comparisons: [{ actual: 21, expected: 4.5, satisfied: true }],
			},
		})
	})

	it('returns fail when the measured contrast is below the configured criterion', {
		timeout: 15_000,
	}, async () => {
		vi.mocked(extractPixelGrid).mockResolvedValue(lowContrastGrid())
		vi.mocked(getCheckPalette).mockResolvedValue([])
		const { runImmediateCheck } = await import(
			'@/features/asset-check/services/run-check.service'
		)

		const result = await runImmediateCheck(
			Buffer.from('low-contrast-image'),
			{ logo: false, typography: true, illustration: false, photography: false },
			[runtimeCheck()],
		)

		expect(result.results['typography.contrast']).toMatchObject({
			rawResult: {
				status: 'fail',
				fulfillment: 0,
				comparisons: [{ expected: 4.5, satisfied: false }],
			},
		})
	})

	it('returns needs_review when a color pair cannot be extracted', async () => {
		vi.mocked(extractPixelGrid).mockResolvedValue(solidGrid())
		vi.mocked(getCheckPalette).mockResolvedValue([])
		const { runImmediateCheck } = await import(
			'@/features/asset-check/services/run-check.service'
		)

		const result = await runImmediateCheck(
			Buffer.from('single-color-image'),
			{ logo: false, typography: true, illustration: false, photography: false },
			[runtimeCheck()],
		)

		expect(result.results['typography.contrast']).toMatchObject({
			rawResult: {
				status: 'needs_review',
				fulfillment: null,
				reasonCode: 'color_pair_not_found',
			},
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

function twoColorGrid(): PixelGrid {
	return {
		width: 10,
		height: 10,
		pixels: [
			...Array.from({ length: 80 }, () => ({ r: 255, g: 255, b: 255 })),
			...Array.from({ length: 20 }, () => ({ r: 0, g: 0, b: 0 })),
		],
		alpha: new Uint8Array(100).fill(255),
	}
}

function solidGrid(): PixelGrid {
	return {
		width: 10,
		height: 10,
		pixels: Array.from({ length: 100 }, () => ({ r: 255, g: 255, b: 255 })),
		alpha: new Uint8Array(100).fill(255),
	}
}

function lowContrastGrid(): PixelGrid {
	return {
		width: 10,
		height: 10,
		pixels: [
			...Array.from({ length: 80 }, () => ({ r: 255, g: 255, b: 255 })),
			...Array.from({ length: 20 }, () => ({ r: 180, g: 180, b: 180 })),
		],
		alpha: new Uint8Array(100).fill(255),
	}
}
