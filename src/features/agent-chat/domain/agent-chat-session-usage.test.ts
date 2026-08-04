import { describe, expect, it } from 'vitest'
import {
	type AgentChatSessionUsageStep,
	createAgentChatSessionUsageCollector,
} from './agent-chat-session-usage'

describe('createAgentChatSessionUsageCollector', () => {
	it('counts used tools and selected skills from agent steps', () => {
		const collector = createAgentChatSessionUsageCollector()

		collector.addStep({
			model: { modelId: 'claude-sonnet-5' },
			response: { modelId: 'claude-sonnet-5' },
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
			toolCalls: [{ toolName: 'loadSkill', input: { name: 'guideline-qa' } }],
			toolResults: [
				{
					toolName: 'loadSkill',
					output: {
						name: 'guideline-qa',
						description: 'Guideline answer skill',
						instructions: 'Answer from published guidelines.',
						model: 'sonnet-5',
						toolScope: 'action',
					},
				},
			],
		} as unknown as AgentChatSessionUsageStep)
		collector.addStep({
			model: { modelId: 'claude-sonnet-5' },
			response: { modelId: 'claude-sonnet-5' },
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
			toolResults: [],
		} as unknown as AgentChatSessionUsageStep)

		expect(collector.snapshot()).toEqual({
			aiUsage: {
				model: 'claude-sonnet-5',
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
							model: 'claude-sonnet-5',
							usage: { input_tokens: 10, output_tokens: 5 },
						},
						{
							model: 'claude-sonnet-5',
							usage: { input_tokens: 20, output_tokens: 7 },
						},
					],
				},
			},
			usedTools: [
				{ name: 'loadSkill', callCount: 1 },
				{ name: 'searchGuidelines', callCount: 1 },
			],
			usedSkills: [{ name: 'guideline-qa', callCount: 1 }],
		})
	})

	it('이름 없는 loadSkill 결과는 skill로 세지 않고 스텝이 없으면 aiUsage를 만들지 않는다', () => {
		const collector = createAgentChatSessionUsageCollector()
		expect(collector.snapshot()).toEqual({
			aiUsage: undefined,
			usedTools: [],
			usedSkills: [],
		})

		collector.addStep({
			model: { modelId: 'claude-sonnet-5' },
			usage: {
				inputTokens: 5,
				inputTokenDetails: {
					noCacheTokens: 5,
					cacheReadTokens: undefined,
					cacheWriteTokens: undefined,
				},
				outputTokens: 2,
				outputTokenDetails: { textTokens: 2, reasoningTokens: undefined },
				totalTokens: 7,
			},
			toolCalls: [{ toolName: 'loadSkill', input: {} }],
			toolResults: [{ toolName: 'loadSkill', output: { error: 'missing' } }],
		} as unknown as AgentChatSessionUsageStep)

		expect(collector.snapshot()).toMatchObject({
			aiUsage: { model: 'claude-sonnet-5', callCount: 1, totalTokens: 7 },
			usedTools: [{ name: 'loadSkill', callCount: 1 }],
			usedSkills: [],
		})
	})
})
