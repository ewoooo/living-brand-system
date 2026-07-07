import { anthropic } from '@ai-sdk/anthropic'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { CheckerContext, CheckResult } from '@/features/asset-check/checkers/types'
import type {
	CheckReferenceAsset,
	CheckRule,
} from '@/features/asset-check/services/get-check-ruleset.service'

const DEFAULT_MODEL = 'claude-haiku-4-5'

const aiRuleResultSchema = z.object({
	key: z.string().min(1),
	status: z.enum(['pass', 'ok', 'needs_review', 'fail']),
	fulfillment: z.number().min(0).max(100).nullable(),
	detail: z.string().min(1).max(300),
})

const aiCheckSchema = z.object({
	results: z.array(aiRuleResultSchema),
})

/**
 * AI 기반 휴리스틱 검수 유스케이스 경계.
 * 모델 호출(AI SDK)과 레퍼런스 이미지 fetch I/O는 현재 이 서비스가 직접 소유한다.
 * ponytail: 두 번째 소비자나 provider 교체가 생기면 repository로 내린다.
 */
export async function runAiCheck(
	rules: CheckRule[],
	ctx: CheckerContext,
): Promise<Record<string, CheckResult>> {
	if (!process.env.ANTHROPIC_API_KEY) return fallbackResults(rules, 'AI 설정 없음')
	if (!ctx.image) return fallbackResults(rules, 'AI 평가용 이미지 없음')

	try {
		const referenceFiles = await loadReferenceFiles(rules)
		const { output } = await generateText({
			model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
			output: Output.object({ schema: aiCheckSchema }),
			system: 'You are a brand guideline checker. Judge only the supplied raster image against the supplied rules and reference images. Do not claim access to font metadata, embedded fonts, CSS, or source design files. Return conservative structured results for every rule key.',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: [
								'Rules:',
								...rules.map(formatRule),
								'Return one result per rule key.',
								'Return pass only when the image clearly and fully satisfies the rule.',
								'Return ok when the image visually appears acceptable but exact metadata or minor details cannot be fully verified from pixels.',
								'Return needs_review only when the image cannot be judged from visual evidence or brand policy context is required.',
								'Return fail when the violation is visually obvious from pixels.',
								'For typography rules, judge visual similarity only. If the visual match is acceptable but exact font metadata is unavailable, return ok instead of needs_review.',
								referenceFiles.length
									? 'Use the attached reference images as the visual basis for typography and usage judgments.'
									: 'No reference images are available; return needs_review for typography family or weight if the PNG is ambiguous.',
								'Use Korean wording like "이미지상 ...로 보입니다" or "PNG만으로 확정하기 어렵습니다". Do not say that a specific font was identified unless metadata was provided.',
							].join('\n'),
						},
						{ type: 'text', text: 'Target image to check:' },
						{
							type: 'file',
							mediaType: ctx.image.mediaType,
							data: ctx.image.data,
						},
						...referenceFiles.flatMap((file) => [
							{ type: 'text' as const, text: `Reference image: ${file.name}` },
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

		const byKey: Record<string, CheckResult> = {}
		for (const result of output.results) {
			byKey[result.key] = {
				executor: 'heuristic',
				status: result.status,
				fulfillment: result.fulfillment,
				detail: result.detail,
			}
		}
		for (const rule of rules) {
			byKey[rule.key] ??= needsManualCheck('AI 평가 결과 없음')
		}
		return byKey
	} catch {
		return fallbackResults(rules, 'AI 평가 실패')
	}
}

function formatRule(rule: CheckRule): string {
	return [
		`- key: ${rule.key}`,
		`  title: ${rule.title}`,
		`  evidence: ${rule.evidence || 'Not provided'}`,
		`  referenceImages: ${rule.referenceAssets.map((asset) => asset.name).join(', ') || 'None'}`,
	].join('\n')
}

async function loadReferenceFiles(rules: CheckRule[]) {
	const assets = new Map<string, CheckReferenceAsset>()
	for (const rule of rules) {
		for (const asset of rule.referenceAssets) assets.set(asset.url, asset)
	}

	const files = await Promise.all(
		[...assets.values()].map(async (asset) => {
			const data = await readReferenceAsset(asset)
			if (!data) return null
			return {
				name: asset.name,
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
		process.env.NEXT_PUBLIC_SITE_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
	return new URL(url, origin).toString()
}

function needsManualCheck(detail: string): CheckResult {
	return { executor: 'heuristic', status: 'needs_review', fulfillment: null, detail }
}

function fallbackResults(rules: CheckRule[], detail: string): Record<string, CheckResult> {
	return Object.fromEntries(rules.map((rule) => [rule.key, needsManualCheck(detail)]))
}
