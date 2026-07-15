/** Checker registry — RuleChecker checkerKey와 실행 구현을 연결한다. */
import { backgroundToneChecker } from './background-tone.checker'
import {
	type CanvasFormat,
	type CanvasFormatOptions,
	makeCanvasFormatChecker,
} from './canvas-format.checker'
import { clearSpaceChecker } from './clear-space.checker'
import { colorCombinationChecker } from './color-combination.checker'
import { extractDominantColorPair } from './color-pair.extractor'
import { contrastChecker, contrastOptionsSchema } from './contrast.checker'
import { evaluateExtraction, evaluateMeasurement } from './deterministic-evaluator'
import { paletteComplianceChecker } from './palette-compliance.checker'
import { relativeSizeChecker } from './relative-size.checker'
import { spotColorChecker } from './spot-color.checker'
import type { AlgorithmChecker, CheckerContext, DeterministicEvaluationResult } from './types'

/**
 * checker key → checker 레지스트리.
 * 기존 essenherb color 검수는 palette(허용 색) + pairing(허용 조합)을 유지하고,
 * 정규화된 contrast는 측정·기준 평가 경로로 별도 등록한다.
 * color.mode는 파일 색모드 메타가 래스터에 없어 spot-color와 같은 픽셀 프록시로 판정한다.
 */
const checkers: Record<string, AlgorithmChecker> = {
	'palette-compliance': paletteComplianceChecker,
	'color-combination': colorCombinationChecker,
	'spot-color': spotColorChecker,
	'background-tone': backgroundToneChecker,
	'clear-space': clearSpaceChecker,
	'relative-size': relativeSizeChecker,
}

const deterministicCheckers: Record<
	string,
	(ctx: CheckerContext, options: unknown) => DeterministicEvaluationResult
> = {
	contrast: (ctx, options) => {
		const parsed = contrastOptionsSchema.safeParse(options)
		if (!parsed.success) {
			return evaluateMeasurement(
				{ state: 'not_measurable', reasonCode: 'invalid_criteria' },
				[],
			)
		}
		const extraction = ctx.grid
			? extractDominantColorPair(ctx.grid)
			: { state: 'not_extractable' as const, reasonCode: 'raster_not_available' }
		return evaluateExtraction(
			extraction,
			contrastChecker,
			parsed.data.criteria,
			parsed.data.parameters,
		)
	},
}

interface CanvasFormatCheckOptions extends CanvasFormatOptions {
	formats: CanvasFormat[]
}

export function getChecker(checkerKey: string, options?: unknown): AlgorithmChecker | null {
	if (checkerKey !== 'canvas-format') return checkers[checkerKey] ?? null
	if (!isCanvasFormatOptions(options)) return null
	return makeCanvasFormatChecker(options.formats, options)
}

export function hasChecker(checkerKey: string, options?: unknown): boolean {
	return getChecker(checkerKey, options) !== null
}

export function hasDeterministicChecker(checkerKey: string): boolean {
	return checkerKey in deterministicCheckers
}

export function runDeterministicChecker(
	checkerKey: string,
	options: unknown,
	ctx: CheckerContext,
): DeterministicEvaluationResult | null {
	return deterministicCheckers[checkerKey]?.(ctx, options) ?? null
}

function isCanvasFormatOptions(value: unknown): value is CanvasFormatCheckOptions {
	if (!value || typeof value !== 'object') return false
	const options = value as Partial<CanvasFormatCheckOptions>
	return (
		Array.isArray(options.formats) &&
		options.formats.length > 0 &&
		options.formats.every(
			(format) =>
				typeof format.label === 'string' &&
				format.label.length > 0 &&
				Number.isFinite(format.width) &&
				format.width > 0 &&
				Number.isFinite(format.height) &&
				format.height > 0,
		) &&
		(options.tolerance === undefined ||
			(Number.isFinite(options.tolerance) && options.tolerance >= 0)) &&
		(options.ignoreOrientation === undefined || typeof options.ignoreOrientation === 'boolean')
	)
}
