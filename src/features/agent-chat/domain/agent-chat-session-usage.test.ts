import { describe, expect, it } from 'vitest'
import { createAgentChatSessionUsageCollector } from './agent-chat-session-usage'

describe('createAgentChatSessionUsageCollector', () => {
	it('counts used tools and selected skills from agent steps', () => {
		const collector = createAgentChatSessionUsageCollector()

		collector.addStep({
			model: { modelId: 'claude-sonnet-4-6' },
			usage: {
				inputTokens: 10,
				inputTokenDetails: {
					noCacheTokens: 8,
					cacheReadTokens: 1,
					cacheWriteTokens: 1,
				},
				outputTokens: 5,
				outputTokenDetails: {
					textTokens: 4,
					reasoningTokens: 1,
				},
				raw: { input_tokens: 10, output_tokens: 5 },
				totalTokens: 15,
			},
			toolCalls: [
				{ toolName: 'loadSkill', input: { name: 'guideline-qa' } },
				{ toolName: 'searchGuidelines', input: { query: 'logo' } },
			],
		})
		collector.addStep({
			model: { modelId: 'claude-opus-5' },
			usage: {
				inputTokens: 20,
				inputTokenDetails: {
					noCacheTokens: 20,
					cacheReadTokens: undefined,
					cacheWriteTokens: undefined,
				},
				outputTokens: 7,
				outputTokenDetails: {
					textTokens: 7,
					reasoningTokens: undefined,
				},
				raw: { input_tokens: 20, output_tokens: 7 },
				totalTokens: 27,
			},
			toolCalls: [{ toolName: 'searchGuidelines', input: { query: 'color' } }],
		})

		expect(collector.snapshot()).toEqual({
			aiUsage: {
				model: 'claude-sonnet-4-6, claude-opus-5',
				callCount: 2,
				inputTokens: 30,
				outputTokens: 12,
				totalTokens: 42,
				cacheReadInputTokens: 1,
				cacheWriteInputTokens: 1,
				reasoningTokens: 1,
				rawUsage: {
					steps: [
						{
							model: 'claude-sonnet-4-6',
							usage: { input_tokens: 10, output_tokens: 5 },
						},
						{
							model: 'claude-opus-5',
							usage: { input_tokens: 20, output_tokens: 7 },
						},
					],
				},
			},
			usedTools: [
				{ name: 'loadSkill', callCount: 1 },
				{ name: 'searchGuidelines', callCount: 2 },
			],
			usedSkills: [{ name: 'guideline-qa', callCount: 1 }],
		})
	})
})
