import { generateText } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'

vi.mock('ai', () => ({
	generateText: vi.fn(),
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
		executor: 'heuristic',
		model: 'rule-spec-model',
		promptKey: 'asset-check.brand-guideline.v1',
		heuristicPrompt: '인물의 표정이 자연스럽고 과장되지 않았는지 우선 판단한다.',
		implemented: true,
		evidence: 'Block title: Lifestyle\nCaption: 자연스러운 일상의 순간',
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
				results: [
					{
						key: 'imagery.mood',
						status: 'ok',
						fulfillment: 80,
						detail: '이미지상 기준에 대체로 부합합니다.',
					},
				],
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
		expect(generateText).toHaveBeenCalledTimes(1)
		const request = vi.mocked(generateText).mock.calls[0]?.[0] as {
			messages?: Array<{ content?: Array<{ text?: string }> }>
		}
		const prompt = request.messages?.[0]?.content?.find((part) => part.text)?.text
		expect(prompt).toContain(
			'evidence: Block title: Lifestyle\nCaption: 자연스러운 일상의 순간',
		)
		expect(prompt).toContain(
			'heuristicPrompt: 인물의 표정이 자연스럽고 과장되지 않았는지 우선 판단한다.',
		)
	})
})
