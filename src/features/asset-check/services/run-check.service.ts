import {
	toCheckResult,
	toDeterministicCheckResult,
} from '@/features/asset-check/checkers/check-result.adapter'
import { opaquePixels } from '@/features/asset-check/checkers/color-metrics'
import { getChecker, runDeterministicChecker } from '@/features/asset-check/checkers/registry'
import type {
	AiCheckResult,
	AiUsage,
	AlgorithmCheckResult,
	CheckerContext,
	CheckResult,
	RawCheckResult,
} from '@/features/asset-check/checkers/types'
import {
	evaluateAdvisory,
	evaluateHeuristic,
} from '@/features/asset-check/domain/heuristic.evaluator'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import {
	type AiCheckRunResult,
	runAiCheck,
} from '@/features/asset-check/repositories/ai-check.ai.repository'
import { extractPixelGrid } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { getCheckPalette } from '@/features/asset-check/services/get-check-palette.service'
import { getRuntimeChecks } from '@/features/asset-check/services/get-check-ruleset.service'
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

/** AI 호출 1건에 싣는 최대 Check 수 — structured output 문법 컴파일 한도 이내로 유지한다. */
const AI_CHECK_BATCH_SIZE = 4

/** AI 단계로 넘길 Check — heuristic 전부, manual은 model이 설정된 advisory만. */
function isPendingAiCheck(check: RuntimeCheck): boolean {
	return check.executor === 'heuristic' || (check.executor === 'manual' && Boolean(check.model))
}

/**
 * 검수 대상 이미지를 deterministic/manual 룰까지만 즉시 판정한다.
 * AI 휴리스틱 Check는 pendingCheckKeys로 분리해 후속 요청이 실행한다.
 * 이미지 decode I/O는 image-decoder repository가, 룰·팔레트 조회 I/O는 각 조회 service의 Payload repository가 소유한다.
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
		if (isPendingAiCheck(check)) {
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
		(check) => isPendingAiCheck(check) && checkKeys.includes(check.key),
	)
	if (checks.length === 0) return { results: {} }

	const byModel = new Map<string, RuntimeCheck[]>()
	for (const check of checks) {
		if (!check.model) continue
		if (check.executor === 'heuristic' && !check.heuristicCriteria?.length) continue
		byModel.set(check.model, [...(byModel.get(check.model) ?? []), check])
	}
	// 한 요청에 check가 많으면 structured output 문법 한도와 요청 크기(레퍼런스 이미지) 한도를
	// 넘고, 출력이 길수록 후반부 관측 품질이 떨어진다. 모델 그룹을 배치로 나눠 병렬 호출한다.
	const groups = [...byModel.values()].flatMap((modelChecks) => {
		const batches: RuntimeCheck[][] = []
		for (let i = 0; i < modelChecks.length; i += AI_CHECK_BATCH_SIZE) {
			batches.push(modelChecks.slice(i, i + AI_CHECK_BATCH_SIZE))
		}
		return batches
	})
	const ctx: CheckerContext = { image: imageInputFrom(buffer), pixels: [], palette: [] }
	const runs = await Promise.all(
		groups.map(async (group) => ({
			keys: new Set(group.map((check) => check.key)),
			run: await runAiCheck(group, ctx),
		})),
	)
	const runByCheckKey = new Map<string, AiCheckRunResult>()
	for (const { keys, run } of runs) {
		for (const key of keys) runByCheckKey.set(key, run)
	}

	return {
		results: Object.fromEntries(
			checks.map((check) => [
				check.key,
				toCheckResult(toAiRawResult(check, runByCheckKey.get(check.key)), check, {
					key: 'ai',
					type: 'ai',
				}),
			]),
		),
		aiUsage: mergeAiUsages(runs.flatMap(({ run }) => (run.aiUsage ? [run.aiUsage] : []))),
	}
}

/** AI 실행 결과(또는 실행 불가 사유)를 Check 1건의 원판정으로 변환한다. */
function toAiRawResult(check: RuntimeCheck, run: AiCheckRunResult | undefined): RawCheckResult {
	if (check.executor === 'heuristic' && !check.heuristicCriteria?.length) {
		return aiNeedsReview('Heuristic 판정 기준 없음', 'invalid_criteria')
	}
	if (!check.model || !run) {
		return aiNeedsReview('AI 검사 도구 설정 오류', 'ai_checker_invalid')
	}
	if (run.unavailableReferenceCheckKeys?.includes(check.key)) {
		return aiNeedsReview('레퍼런스 이미지 불러오기 실패', 'reference_asset_unavailable')
	}
	if (run.failure) return aiNeedsReview(run.failure.detail, run.failure.reasonCode)
	return check.executor === 'manual'
		? evaluateAdvisory(run.advices[check.key])
		: evaluateHeuristic(check.heuristicCriteria ?? [], run.observations[check.key])
}

function aiNeedsReview(detail: string, reasonCode: string): AiCheckResult {
	return { status: 'needs_review', fulfillment: null, detail, reasonCode }
}

/** 모델 그룹별 usage를 세션 저장용 단일 usage로 합산한다. */
function mergeAiUsages(usages: AiUsage[]): AiUsage | undefined {
	if (usages.length <= 1) return usages[0]
	const total = (read: (usage: AiUsage) => number | undefined) =>
		usages.reduce((sum, usage) => sum + (read(usage) ?? 0), 0)
	return {
		model: usages.map((usage) => usage.model).join(', '),
		callCount: total((usage) => usage.callCount),
		inputTokens: total((usage) => usage.inputTokens),
		outputTokens: total((usage) => usage.outputTokens),
		totalTokens: total((usage) => usage.totalTokens),
		cacheReadInputTokens: total((usage) => usage.cacheReadInputTokens),
		cacheWriteInputTokens: total((usage) => usage.cacheWriteInputTokens),
		reasoningTokens: total((usage) => usage.reasoningTokens),
		rawUsage: { groups: usages.map((usage) => usage.rawUsage ?? {}) },
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

// AI로 가는 Check(heuristic, model 있는 manual)는 호출 전에 분기되므로 여기 오지 않는다.
// model 없는 manual은 여기서 기존 담당자 확인 폴백을 유지한다.
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
