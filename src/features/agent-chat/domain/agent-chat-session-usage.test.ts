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

	it('공급자가 캐시 필드를 주지 않으면 0으로 채우지 않고 undefined로 남긴다', () => {
		const collector = createAgentChatSessionUsageCollector()

		collector.addStep({
			model: { modelId: 'claude-sonnet-5' },
			usage: {
				inputTokens: 10,
				inputTokenDetails: { noCacheTokens: 10 },
				outputTokens: 5,
				outputTokenDetails: { textTokens: 5 },
				totalTokens: 15,
			},
			toolCalls: [],
			toolResults: [],
		} as unknown as AgentChatSessionUsageStep)

		const { aiUsage } = collector.snapshot()

		// 어드민 표에서 "공급자가 안 줬다"와 "진짜 0(캐시 미스)"이 구분되어야 한다.
		expect(aiUsage).not.toHaveProperty('cacheReadInputTokens')
		expect(aiUsage).not.toHaveProperty('cacheWriteInputTokens')
		expect(aiUsage).not.toHaveProperty('reasoningTokens')
		expect(aiUsage).toMatchObject({ callCount: 1, inputTokens: 10, totalTokens: 15 })
	})

	it('캐시 미스로 0이 온 경우는 0으로 기록한다', () => {
		const collector = createAgentChatSessionUsageCollector()

		collector.addStep({
			model: { modelId: 'claude-sonnet-5' },
			usage: {
				inputTokens: 10,
				inputTokenDetails: {
					noCacheTokens: 10,
					cacheReadTokens: 0,
					cacheWriteTokens: 4000,
				},
				outputTokens: 5,
				outputTokenDetails: { textTokens: 5, reasoningTokens: 0 },
				totalTokens: 15,
			},
			toolCalls: [],
			toolResults: [],
		} as unknown as AgentChatSessionUsageStep)

		expect(collector.snapshot().aiUsage).toMatchObject({
			cacheReadInputTokens: 0,
			cacheWriteInputTokens: 4000,
			reasoningTokens: 0,
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
