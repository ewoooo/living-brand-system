import { anthropic } from '@ai-sdk/anthropic'
import { generateText, type LanguageModelUsage, NoObjectGeneratedError, Output } from 'ai'
import { z } from 'zod'
import { env } from '@/env'
import { heuristicObservationSchema } from '@/features/asset-check/checkers/heuristic-evaluator'
import type { AiUsage, CheckerContext } from '@/features/asset-check/checkers/types'
import type {
	CheckReferenceAsset,
	RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'

export const AI_CHECK_PROMPT_KEY = 'asset-check.brand-guideline.v1'

export interface AiCheckRunResult {
	observations: Record<string, Record<string, z.infer<typeof heuristicObservationSchema>>>
	failure?: { detail: string; reasonCode: string }
	aiUsage?: AiUsage
}

/**
 * AI 기반 휴리스틱 검수 adapter.
 * 모델 호출(AI SDK)과 레퍼런스 이미지 fetch I/O를 소유한다.
 */
export async function runAiCheck(
	checks: RuntimeCheck[],
	ctx: CheckerContext,
): Promise<AiCheckRunResult> {
	if (!env.ANTHROPIC_API_KEY) return failed('AI 설정 없음', 'ai_not_configured')
	if (!ctx.image) return failed('AI 평가용 이미지 없음', 'image_not_available')
	if (checks.some((check) => !check.heuristicCriteria?.length)) {
		return failed('Heuristic 판정 기준 없음', 'invalid_criteria')
	}
	const { model, promptKey } = checks[0] ?? {}
	if (
		!model ||
		promptKey !== AI_CHECK_PROMPT_KEY ||
		checks.some((check) => check.model !== model || check.promptKey !== promptKey)
	) {
		return failed('AI 검사 도구 설정 오류', 'ai_checker_invalid')
	}

	try {
		const referenceFiles = await loadReferenceFiles(checks)
		const schema = buildAiCheckSchema(checks)
		const { output, usage } = await generateText({
			model: anthropic(model),
			output: Output.object({ schema }),
			temperature: 0,
			system: 'You are a brand guideline observer. Observe only the supplied raster image against each question. Never decide whether a rule passes or fails. Do not claim access to font metadata, embedded fonts, CSS, or source design files.',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: [
								'Checks:',
								...checks.map(formatCheck),
								'Return one observation for every criterion id.',
								'Treat each evidence value as the complete normalized text content of the document or block that owns that check.',
								'Apply heuristicPrompt as additional observation context without changing the output contract.',
								'Return present when the questioned condition is visibly present, absent when it is visibly absent, and uncertain when pixels or supplied context are insufficient.',
								'Do not return pass, ok, needs_review, fail, fulfillment, or an overall approval decision.',
								referenceFiles.length
									? 'Use each attached reference image according to its stated positive, negative, or context role.'
									: 'No reference images are available; return uncertain for typography family or weight if the PNG is ambiguous.',
								'Use concise Korean reasons such as "이미지상 ...로 보입니다" or "PNG만으로 확정하기 어렵습니다". Do not say that a specific font was identified unless metadata was provided.',
							].join('\n'),
						},
						{ type: 'text', text: 'Target image to check:' },
						{
							type: 'file',
							mediaType: ctx.image.mediaType,
							data: ctx.image.data,
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
			{ observations: Record<string, z.infer<typeof heuristicObservationSchema>> }
		>
		return {
			observations: Object.fromEntries(
				checks.map((check) => [check.key, results[check.key]?.observations ?? {}]),
			),
			aiUsage: toAiUsage(model, usage),
		}
	} catch (error) {
		return NoObjectGeneratedError.isInstance(error)
			? failed('AI 관측값 형식 오류', 'ai_output_invalid')
			: failed('AI 평가 실패', 'ai_request_failed')
	}
}

function buildAiCheckSchema(checks: RuntimeCheck[]) {
	return z.strictObject({
		results: z.strictObject(
			Object.fromEntries(
				checks.map((check) => [
					check.key,
					z.strictObject({
						observations: z.strictObject(
							Object.fromEntries(
								(check.heuristicCriteria ?? []).map((criterion) => [
									criterion.id,
									heuristicObservationSchema,
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

function formatCheck(check: RuntimeCheck): string {
	return [
		`- key: ${check.key}`,
		`  titleEn: ${check.title}`,
		`  titleKo: ${check.titleKo || 'Not provided'}`,
		`  evidence: ${check.evidence || 'Not provided'}`,
		`  heuristicPrompt: ${check.heuristicPrompt || 'Not provided'}`,
		'  criteria:',
		...(check.heuristicCriteria ?? []).map(
			(criterion) => `    - id: ${criterion.id}\n      question: ${criterion.question}`,
		),
		`  referenceImages: ${check.referenceAssets.map((asset) => `${asset.role}:${asset.name}`).join(', ') || 'None'}`,
	].join('\n')
}

async function loadReferenceFiles(checks: RuntimeCheck[]) {
	const assets = new Map<string, CheckReferenceAsset>()
	for (const check of checks) {
		for (const asset of check.referenceAssets) assets.set(`${asset.url}:${asset.role}`, asset)
	}

	const files = await Promise.all(
		[...assets.values()].map(async (asset) => {
			const data = await readReferenceAsset(asset)
			if (!data) return null
			return {
				name: asset.name,
				role: asset.role,
				mediaType: asset.mimeType,
				data,
			}
		}),
	)

	return files.filter((file) => file !== null)
}

async function readReferenceAsset(asset: CheckReferenceAsset): Promise<Buffer | null> {
	const response = await fetch(toAbsoluteUrl(asset.url)).catch(() => null)
	if (!response?.ok) return null
	return Buffer.from(await response.arrayBuffer())
}

function toAbsoluteUrl(url: string) {
	if (/^https?:\/\//.test(url)) return url
	const origin =
		env.NEXT_PUBLIC_SITE_URL ||
		(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000')
	return new URL(url, origin).toString()
}

function failed(detail: string, reasonCode: string): AiCheckRunResult {
	return { observations: {}, failure: { detail, reasonCode } }
}
