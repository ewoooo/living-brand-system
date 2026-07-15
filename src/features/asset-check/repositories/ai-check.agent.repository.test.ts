import { generateText, Output } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'

vi.mock('ai', () => ({
	generateText: vi.fn(),
	NoObjectGeneratedError: { isInstance: vi.fn(() => false) },
	Output: {
		object: vi.fn((value) => value),
	},
}))

vi.mock('@ai-sdk/anthropic', () => ({
	anthropic: vi.fn((model: string) => ({ model })),
}))

const checks: RuntimeCheck[] = [
	{
		key: 'imagery.mood',
		title: 'Imagery mood',
		titleKo: '이미지 무드',
		source: { documentId: 12 },
		checker: { key: 'asset-check.brand-guideline', type: 'heuristic' },
		executor: 'heuristic',
		model: 'rule-spec-model',
		prompt: '브랜드 사진의 자연광 기준을 우선 적용한다.',
		heuristicPrompt: '인물의 표정이 자연스럽고 과장되지 않았는지 우선 판단한다.',
		heuristicCriteria: [
			{
				id: 'natural-expression',
				question: '인물의 표정이 자연스러운가?',
				expected: 'present',
			},
		],
		implemented: true,
		evidence: {
			type: 'columnUnit',
			columns: [{ heading: 'Lifestyle', body: '자연스러운 일상의 순간' }],
		},
		referenceAssets: [],
		messages: {},
	},
]

describe('runAiCheck', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
		vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/test')
		vi.stubEnv('PAYLOAD_SECRET', 'test-secret')
		vi.mocked(generateText).mockReset()
	})

	it('maps AI SDK token usage for cost analysis', async () => {
		vi.mocked(generateText).mockResolvedValue({
			output: {
				results: {
					'imagery.mood': {
						observations: {
							'natural-expression': {
								value: 'present',
								confidence: 80,
								reason: '자연스러운 표정이 관측됩니다.',
							},
						},
					},
				},
			},
			usage: {
				inputTokens: 100,
				inputTokenDetails: {
					noCacheTokens: 85,
					cacheReadTokens: 10,
					cacheWriteTokens: 5,
				},
				outputTokens: 20,
				outputTokenDetails: {
					textTokens: 20,
					reasoningTokens: 0,
				},
				totalTokens: 120,
				raw: { providerUsage: true },
			},
		} as unknown as Awaited<ReturnType<typeof generateText>>)

		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)
		const result = await runAiCheck(checks, {
			image: { data: Buffer.from('png'), mediaType: 'image/png' },
			pixels: [],
			palette: [],
		})

		expect(result.aiUsage).toEqual({
			model: 'rule-spec-model',
			callCount: 1,
			inputTokens: 100,
			outputTokens: 20,
			totalTokens: 120,
			cacheReadInputTokens: 10,
			cacheWriteInputTokens: 5,
			reasoningTokens: 0,
			rawUsage: { providerUsage: true },
		})
		expect(result.observations).toEqual({
			'imagery.mood': {
				'natural-expression': {
					value: 'present',
					confidence: 80,
					reason: '자연스러운 표정이 관측됩니다.',
				},
			},
		})
		expect(generateText).toHaveBeenCalledTimes(1)
		expect(vi.mocked(generateText).mock.calls[0]?.[0]).not.toHaveProperty('temperature')
		const request = vi.mocked(generateText).mock.calls[0]?.[0] as {
			system?: string
			messages?: Array<{ content?: Array<{ text?: string; type?: string }> }>
		}
		const content = request.messages?.[0]?.content ?? []
		const jsonText = content.find((part) => part.text?.startsWith('{"checks":'))?.text
		expect(JSON.parse(jsonText ?? '')).toEqual({
			checks: [
				{
					key: 'imagery.mood',
					titleEn: 'Imagery mood',
					titleKo: '이미지 무드',
					source: { documentId: 12 },
					evidence: {
						type: 'columnUnit',
						columns: [{ heading: 'Lifestyle', body: '자연스러운 일상의 순간' }],
					},
					heuristicPrompt: '인물의 표정이 자연스럽고 과장되지 않았는지 우선 판단한다.',
					checkerPrompt: '브랜드 사진의 자연광 기준을 우선 적용한다.',
					criteria: [
						{
							id: 'natural-expression',
							question: '인물의 표정이 자연스러운가?',
						},
					],
					referenceAssets: [],
				},
			],
		})
		expect(jsonText).not.toContain('expected')
		expect(request.system).toContain('untrusted source data')
		expect(content.some((part) => part.type === 'file')).toBe(true)

		const schema = (
			vi.mocked(Output.object).mock.calls[0]?.[0] as {
				schema: { safeParse: (value: unknown) => { success: boolean } }
			}
		).schema
		expect(schema.safeParse({ results: {} }).success).toBe(false)
		expect(
			schema.safeParse({
				results: {
					'imagery.mood': {
						observations: {
							'natural-expression': {
								value: 'present',
								confidence: 80,
								reason: '자연스러운 표정이 관측됩니다.',
							},
						},
					},
				},
			}).success,
		).toBe(true)
	})

	it('AI 요청 실패는 판정 대신 구조화된 실패 사유를 반환한다', async () => {
		vi.mocked(generateText).mockRejectedValue(new Error('provider unavailable'))
		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)

		const result = await runAiCheck(checks, {
			image: { data: Buffer.from('png'), mediaType: 'image/png' },
			pixels: [],
			palette: [],
		})

		expect(result).toEqual({
			observations: {},
			failure: { detail: 'AI 평가 실패', reasonCode: 'ai_request_failed' },
		})
	})

	it('checker prompt를 관찰 컨텍스트로 메시지에 삽입한다', async () => {
		vi.mocked(generateText).mockResolvedValue({
			output: { results: {} },
			usage: undefined,
		} as unknown as Awaited<ReturnType<typeof generateText>>)
		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)

		await runAiCheck(checks, {
			image: { data: new Uint8Array([1]), mediaType: 'image/png' },
		} as never)

		const call = vi.mocked(generateText).mock.calls[0]?.[0] as {
			messages: { content: { type: string; text?: string }[] }[]
		}
		const content = call.messages[0]?.content ?? []
		const jsonText = content.find((part) => part.text?.startsWith('{"checks":'))?.text
		expect(JSON.parse(jsonText ?? '').checks[0].checkerPrompt).toBe(
			'브랜드 사진의 자연광 기준을 우선 적용한다.',
		)
		expect(content[0]?.text).toContain(
			'Apply heuristicPrompt and checkerPrompt as additional observation context',
		)
	})
})
