import {
	toCheckResult,
	toDeterministicCheckResult,
} from '@/features/asset-check/checkers/check-result.adapter'
import { opaquePixels } from '@/features/asset-check/checkers/color-metrics'
import { evaluateHeuristic } from '@/features/asset-check/checkers/heuristic-evaluator'
import { getChecker, runDeterministicChecker } from '@/features/asset-check/checkers/registry'
import type {
	AiUsage,
	AlgorithmCheckResult,
	CheckerContext,
	CheckResult,
} from '@/features/asset-check/checkers/types'
import { runAiCheck } from '@/features/asset-check/repositories/ai-check.agent.repository'
import { extractPixelGrid } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { getCheckPalette } from '@/features/asset-check/services/get-check-palette.service'
import {
	getRuntimeChecks,
	type RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import type { ImageContentFlags } from '@/features/asset-check/types'
import { detectCheckImageMediaType } from '@/features/asset-check/utils/image-format'

export interface ImmediateCheckResult {
	results: Record<string, CheckResult>
	pendingCheckKeys: string[]
}

export interface HeuristicCheckResult {
	results: Record<string, CheckResult>
	aiUsage?: AiUsage
}

/**
 * 검수 대상 이미지를 deterministic/manual 룰까지만 즉시 판정한다.
 * AI 휴리스틱 Check는 pendingCheckKeys로 분리해 후속 요청이 실행한다.
 */
export async function runImmediateCheck(
	buffer: Buffer,
	flags: ImageContentFlags,
	inputChecks?: RuntimeCheck[],
): Promise<ImmediateCheckResult> {
	const [grid, checks, palette] = await Promise.all([
		extractPixelGrid(buffer),
		inputChecks ?? getRuntimeChecks(),
		getCheckPalette(),
	])
	const pixels = opaquePixels(grid)
	const image = imageInputFrom(buffer)

	const results: Record<string, CheckResult> = {}
	const pendingCheckKeys: string[] = []
	const ctx = { pixels, palette, grid, image }
	for (const check of checks) {
		if (results[check.key] || !shouldRunCheck(check.key, flags)) continue
		if (check.executor === 'heuristic') {
			pendingCheckKeys.push(check.key)
			continue
		}
		const result = runCheckByExecutor(check, ctx)
		if (result) results[check.key] = result
	}

	return { results, pendingCheckKeys }
}

/**
 * 후속 AI 검수 요청에서 heuristic 룰만 판정한다.
 * 첫 응답의 pendingCheckKeys를 기준으로 실행 범위를 좁힌다.
 * 모델 I/O는 ai-check Agent repository가 소유한다.
 */
export async function runHeuristicCheck(
	buffer: Buffer,
	checkKeys: string[],
	inputChecks?: RuntimeCheck[],
): Promise<HeuristicCheckResult> {
	const checks = (inputChecks ?? (await getRuntimeChecks(checkKeys))).filter(
		(check) => check.executor === 'heuristic' && checkKeys.includes(check.key),
	)
	if (checks.length === 0) return { results: {} }
	const validChecks = checks.filter((check) => check.heuristicCriteria?.length)
	const aiCheck = validChecks.length
		? await runAiCheck(validChecks, {
				image: imageInputFrom(buffer),
				pixels: [],
				palette: [],
			})
		: null
	return {
		results: Object.fromEntries(
			checks.map((check) => [
				check.key,
				toCheckResult(
					!check.heuristicCriteria?.length
						? {
								status: 'needs_review',
								fulfillment: null,
								detail: 'Heuristic 판정 기준 없음',
								reasonCode: 'invalid_criteria',
							}
						: aiCheck?.failure
							? {
									status: 'needs_review',
									fulfillment: null,
									detail: aiCheck.failure.detail,
									reasonCode: aiCheck.failure.reasonCode,
								}
							: evaluateHeuristic(
									check.heuristicCriteria ?? [],
									aiCheck?.observations[check.key],
								),
					check,
					{ key: 'ai', type: 'ai' },
				),
			]),
		),
		aiUsage: aiCheck?.aiUsage,
	}
}

/** Check가 요소 종속이면 시나리오 플래그가 켜져 있을 때만 검수한다. */
function shouldRunCheck(checkKey: string, flags: ImageContentFlags): boolean {
	if (checkKey.startsWith('logo.')) return flags.logo
	if (checkKey.startsWith('typography.')) return flags.typography
	if (checkKey.startsWith('illustration.')) return flags.illustration
	if (checkKey.startsWith('imagery.')) return flags.photography
	return true
}

// heuristic Check는 호출 전에 runAiCheck로 분기되므로 여기 오지 않는다.
function runCheckByExecutor(check: RuntimeCheck, ctx: CheckerContext): CheckResult | null {
	if (check.executor === 'manual') {
		const rawResult: AlgorithmCheckResult = {
			status: 'needs_review',
			fulfillment: null,
			detail: '브랜드 담당자 확인 필요',
		}
		return toCheckResult(rawResult, check, { key: 'manual', type: 'manual' })
	}
	const evaluation = check.checkerKey
		? runDeterministicChecker(check.checkerKey, check.options, ctx)
		: null
	if (evaluation && check.checkerKey) {
		return toDeterministicCheckResult(evaluation, check, check.checkerKey)
	}
	const checker = check.checkerKey ? getChecker(check.checkerKey, check.options) : null
	if (!checker) return null
	const result = checker(ctx)
	return result
		? toCheckResult(result, check, { key: check.checkerKey ?? check.key, type: 'algorithm' })
		: null
}
function imageInputFrom(buffer: Buffer): CheckerContext['image'] {
	const mediaType = detectCheckImageMediaType(buffer)
	return mediaType ? { data: buffer, mediaType } : undefined
}
