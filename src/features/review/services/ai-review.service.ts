import { anthropic } from '@ai-sdk/anthropic'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { CheckerContext, CheckResult } from '@/features/review/checkers/types'
import type { ReviewRule } from '@/features/review/services/get-review-ruleset.service'

const DEFAULT_MODEL = 'claude-haiku-4-5'

const aiRuleResultSchema = z.object({
	key: z.string().min(1),
	status: z.enum(['pass', 'fail']),
	fulfillment: z.number().min(0).max(100).nullable(),
	detail: z.string().min(1).max(300),
})

const aiReviewSchema = z.object({
	results: z.array(aiRuleResultSchema),
})

/**
 * AI 기반 휴리스틱 검수 경계. 실제 모델 호출 I/O는 repository를 추가할 때 그 아래가 소유한다.
 */
export async function runAiReview(
	rules: ReviewRule[],
	ctx: CheckerContext,
): Promise<Record<string, CheckResult>> {
	if (!process.env.ANTHROPIC_API_KEY) return fallbackResults(rules, 'AI 설정 없음')
	if (!ctx.image) return fallbackResults(rules, 'AI 평가용 이미지 없음')

	try {
		const { output } = await generateText({
			model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
			output: Output.object({ schema: aiReviewSchema }),
			system: 'You are a brand guideline reviewer. Judge only the supplied image against the supplied rules. Return conservative structured results for every rule key.',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: [
								'Rules:',
								...rules.map(formatRule),
								'Return one result per rule key. Return pass only when the image clearly satisfies the rule. If uncertain, return fail with a short Korean detail.',
							].join('\n'),
						},
						{
							type: 'file',
							mediaType: ctx.image.mediaType,
							data: ctx.image.data,
						},
					],
				},
			],
		})

		const byKey: Record<string, CheckResult> = {}
		for (const result of output.results) {
			byKey[result.key] = {
				status: result.status,
				fulfillment: result.fulfillment,
				detail: result.detail,
			}
		}
		for (const rule of rules) {
			byKey[rule.key] ??= needsAi('AI 평가 결과 없음')
		}
		return byKey
	} catch {
		return fallbackResults(rules, 'AI 평가 실패')
	}
}

function formatRule(rule: ReviewRule): string {
	return [
		`- key: ${rule.key}`,
		`  title: ${rule.titleKo}`,
		`  scoring: ${rule.scoring || 'Not provided'}`,
		`  input: ${rule.input || 'Not provided'}`,
		`  evidence: ${rule.evidence || 'Not provided'}`,
	].join('\n')
}

function needsAi(detail: string): CheckResult {
	return { status: 'needs_ai', fulfillment: null, detail }
}

function fallbackResults(rules: ReviewRule[], detail: string): Record<string, CheckResult> {
	return Object.fromEntries(rules.map((rule) => [rule.key, needsAi(detail)]))
}
