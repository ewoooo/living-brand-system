import { describe, expect, it } from 'vitest'
import { createAgentChatSessionUsageCollector } from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'

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
				totalTokens: 15,
			},
			toolCalls: [
				{ toolName: 'loadSkill', input: { name: 'guideline-qa' } },
				{ toolName: 'searchGuidelines', input: { query: 'logo' } },
			],
		})
		collector.addStep({
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
				totalTokens: 27,
			},
			toolCalls: [{ toolName: 'searchGuidelines', input: { query: 'color' } }],
		})

		expect(collector.snapshot()).toEqual({
			aiUsage: {
				model: 'claude-sonnet-4-6',
				callCount: 2,
				inputTokens: 30,
				outputTokens: 12,
				totalTokens: 42,
				cacheReadInputTokens: 1,
				cacheWriteInputTokens: 1,
				reasoningTokens: 1,
			},
			usedTools: [
				{ name: 'loadSkill', callCount: 1 },
				{ name: 'searchGuidelines', callCount: 2 },
			],
			usedSkills: [{ name: 'guideline-qa', callCount: 1 }],
		})
	})
})
