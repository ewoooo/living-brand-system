import { anthropic } from '@ai-sdk/anthropic'
import { generateText, type LanguageModelUsage, NoObjectGeneratedError, Output } from 'ai'
import { z } from 'zod'
import { env } from '@/env'
import type { AiUsage, CheckerContext } from '@/features/asset-check/checkers/types'
import { buildAiObservationTask } from '@/features/asset-check/domain/ai-observation-task'
import {
	type HeuristicObservation,
	measureObservationSchema,
	presenceObservationSchema,
} from '@/features/asset-check/domain/heuristic.evaluator'
import type { CheckReferenceAsset, RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import {
	compressForAiReference,
	resizeForAiVision,
} from '@/features/asset-check/repositories/image-decoder.sharp.repository'

export interface AiCheckRunResult {
	observations: Record<string, Record<string, HeuristicObservation>>
	advices: Record<string, string>
	failure?: { detail: string; reasonCode: string }
	unavailableReferenceCheckKeys?: string[]
	aiUsage?: AiUsage
}

/**
 * Asset check의 AI 기반 휴리스틱 검수 adapter.
 * 모델 호출(AI SDK)과 레퍼런스 이미지 fetch I/O를 소유한다.
 */
export async function runAiCheck(
	checks: RuntimeCheck[],
	ctx: CheckerContext,
): Promise<AiCheckRunResult> {
	if (!env.ANTHROPIC_API_KEY) return failed('AI 설정 없음', 'ai_not_configured')
	if (!ctx.image) return failed('AI 평가용 이미지 없음', 'image_not_available')
	if (
		checks.some((check) => check.executor === 'heuristic' && !check.heuristicCriteria?.length)
	) {
		return failed('Heuristic 판정 기준 없음', 'invalid_criteria')
	}
	const { model } = checks[0] ?? {}
	if (!model || checks.some((check) => check.model !== model)) {
		return failed('AI 검사 도구 설정 오류', 'ai_checker_invalid')
	}

	let unavailableReferenceCheckKeys: string[] | undefined
	try {
		const [targetImage, referenceFilesByKey] = await Promise.all([
			resizeForAiVision(ctx.image.data),
			loadAiReferenceFiles(checks),
		])
		unavailableReferenceCheckKeys = findUnavailableAiReferenceCheckKeys(
			checks,
			referenceFilesByKey,
		)
		const runnableChecks = checks.filter(
			(check) => !unavailableReferenceCheckKeys?.includes(check.key),
		)
		if (runnableChecks.length === 0) {
			return { observations: {}, advices: {}, unavailableReferenceCheckKeys }
		}
		const referenceKeys = new Set(
			runnableChecks.flatMap((check) => check.referenceAssets.map(aiReferenceAssetKey)),
		)
		const referenceFiles = [...referenceKeys].flatMap((key) => {
			const file = referenceFilesByKey.get(key)
			return file ? [file] : []
		})
		const observationTask = buildAiObservationTask(runnableChecks, referenceFiles.length > 0)
		const schema = buildAiCheckSchema(runnableChecks)
		const { output, usage } = await generateText({
			model: anthropic(model),
			output: Output.object({ schema }),
			// jsonTool 모드는 모델이 간헐적으로 results를 JSON 문자열로 감싸 통째로 실패한다.
			// outputFormat(output_config)은 API가 스키마를 강제해 형식 실패를 차단한다.
			providerOptions: { anthropic: { structuredOutputMode: 'outputFormat' } },
			// 기본값 4096이면 check가 많을 때 관측값 JSON이 잘려 통째로 실패한다.
			// criterion당 reason(≤300자) 포함 ~300토큰, advisory당 ~800토큰으로 잡는다.
			maxOutputTokens: Math.min(
				64000,
				2000 +
					runnableChecks.reduce(
						(sum, check) =>
							sum +
							(check.executor === 'manual'
								? 800
								: (check.heuristicCriteria?.length ?? 0) * 300),
						0,
					),
			),
			system: observationTask.systemPrompt,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: [
								'The next text part contains the checks as JSON source data.',
								...observationTask.instructions,
							].join('\n'),
						},
						{
							type: 'text',
							text: JSON.stringify({ checks: observationTask.checks }),
						},
						{ type: 'text', text: 'Target image to check:' },
						{
							type: 'file',
							mediaType: ctx.image.mediaType,
							data: targetImage,
						},
						...referenceFiles.flatMap((file) => [
							{
								type: 'text' as const,
								text: `Reference image (${file.role}): ${file.name}`,
							},
							{
								type: 'file' as const,
								mediaType: file.mediaType,
								data: file.data,
							},
						]),
					],
				},
			],
		})

		const results = output.results as Record<
			string,
			{
				observations?: Record<string, HeuristicObservation>
				advice?: string
			}
		>
		return {
			observations: Object.fromEntries(
				runnableChecks
					.filter((check) => check.executor !== 'manual')
					.map((check) => [check.key, results[check.key]?.observations ?? {}]),
			),
			advices: Object.fromEntries(
				runnableChecks.flatMap((check) => {
					const advice = results[check.key]?.advice
					return check.executor === 'manual' && advice ? [[check.key, advice]] : []
				}),
			),
			...(unavailableReferenceCheckKeys.length ? { unavailableReferenceCheckKeys } : {}),
			aiUsage: toAiUsage(model, usage),
		}
	} catch (error) {
		// 실패는 needs_review로만 수렴해 원인이 숨는다. 진단용으로 사유는 남긴다.
		console.error('[ai-check] AI 평가 실패:', error instanceof Error ? error.message : error)
		return NoObjectGeneratedError.isInstance(error)
			? failed('AI 관측값 형식 오류', 'ai_output_invalid', unavailableReferenceCheckKeys)
			: failed('AI 평가 실패', 'ai_request_failed', unavailableReferenceCheckKeys)
	}
}

function buildAiCheckSchema(checks: RuntimeCheck[]) {
	return z.strictObject({
		results: z.strictObject(
			Object.fromEntries(
				checks.map((check) => [
					check.key,
					check.executor === 'manual'
						? z.strictObject({ advice: z.string().min(1) })
						: z.strictObject({
								observations: z.strictObject(
									Object.fromEntries(
										(check.heuristicCriteria ?? []).map((criterion) => [
											criterion.id,
											criterion.kind === 'measure'
												? measureObservationSchema
												: presenceObservationSchema,
										]),
									),
								),
							}),
				]),
			),
		),
	})
}

function toAiUsage(model: string, usage: LanguageModelUsage): AiUsage {
	return {
		model,
		callCount: 1,
		inputTokens: usage.inputTokens,
		outputTokens: usage.outputTokens,
		totalTokens: usage.totalTokens,
		cacheReadInputTokens: usage.inputTokenDetails.cacheReadTokens,
		cacheWriteInputTokens: usage.inputTokenDetails.cacheWriteTokens,
		reasoningTokens: usage.outputTokenDetails.reasoningTokens,
		rawUsage: usage.raw,
	}
}

export async function loadAiReferenceFiles(checks: RuntimeCheck[]) {
	const assets = new Map<string, CheckReferenceAsset>()
	for (const check of checks) {
		for (const asset of check.referenceAssets) assets.set(aiReferenceAssetKey(asset), asset)
	}

	const files = await Promise.all(
		[...assets].map(async ([key, asset]) => {
			try {
				const raw = await readReferenceAsset(asset)
				if (!raw) return [key, null] as const
				const { data, mediaType } = await compressForAiReference(raw, asset.mimeType)
				return [
					key,
					{
						name: asset.name,
						role: asset.role,
						mediaType,
						data,
					},
				] as const
			} catch {
				return [key, null] as const
			}
		}),
	)

	return new Map(files)
}

export function findUnavailableAiReferenceCheckKeys(
	checks: RuntimeCheck[],
	referenceFilesByKey: Awaited<ReturnType<typeof loadAiReferenceFiles>>,
) {
	return checks
		.filter((check) =>
			check.referenceAssets.some(
				(asset) => !referenceFilesByKey.get(aiReferenceAssetKey(asset)),
			),
		)
		.map((check) => check.key)
}

async function readReferenceAsset(asset: CheckReferenceAsset): Promise<Buffer | null> {
	const response = await fetch(toAbsoluteUrl(asset.url))
	if (!response.ok) return null
	return Buffer.from(await response.arrayBuffer())
}

export function aiReferenceAssetKey(asset: CheckReferenceAsset) {
	return `${asset.url}:${asset.role}`
}

function toAbsoluteUrl(url: string) {
	if (/^https?:\/\//.test(url)) return url
	const origin =
		env.NEXT_PUBLIC_SITE_URL ||
		(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000')
	return new URL(url, origin).toString()
}

function failed(
	detail: string,
	reasonCode: string,
	unavailableReferenceCheckKeys?: string[],
): AiCheckRunResult {
	return {
		observations: {},
		advices: {},
		failure: { detail, reasonCode },
		...(unavailableReferenceCheckKeys?.length ? { unavailableReferenceCheckKeys } : {}),
	}
}
