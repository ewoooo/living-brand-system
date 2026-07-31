import { describe, expect, it } from 'vitest'
import { createAgentChatSessionUsageCollector } from './agent-chat-session-usage'

describe('createAgentChatSessionUsageCollector', () => {
	it('counts used tools and selected skills from agent steps', () => {
		const collector = createAgentChatSessionUsageCollector()

		collector.addStep({
			model: { modelId: 'claude-haiku-4-5' },
			response: { modelId: 'claude-haiku-4-5' },
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
					output: { verificationRequired: true },
				},
			],
		})
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
			toolCalls: [{ toolName: 'loadSkill', input: { name: 'guideline-qa' } }],
			toolResults: [
				{
					toolName: 'loadSkill',
					output: {
						name: 'guideline-qa',
						description: 'Guideline answer skill',
						instructions: 'Answer from published guidelines.',
						responseLevel: 'deep',
						taskType: 'lookup',
						risk: 'low',
						confidence: 80,
						model: 'opus-5.0',
						toolScope: 'read',
						reviewRequired: false,
						clarificationRequired: false,
					},
				},
			],
		})
		collector.addStep({
			model: { modelId: 'claude-opus-5' },
			response: { modelId: 'claude-opus-5' },
			usage: {
				inputTokens: 5,
				inputTokenDetails: {},
				outputTokens: 2,
				outputTokenDetails: {},
				totalTokens: 7,
			},
			toolCalls: [{ toolName: 'searchGuidelines', input: { query: 'color' } }],
		})

		expect(collector.snapshot()).toEqual({
			aiUsage: {
				model: 'claude-haiku-4-5, claude-sonnet-5, claude-opus-5',
				callCount: 3,
				inputTokens: 35,
				outputTokens: 14,
				totalTokens: 49,
				cacheReadInputTokens: 1,
				cacheWriteInputTokens: 1,
				reasoningTokens: 1,
				rawUsage: {
					steps: [
						{
							model: 'claude-haiku-4-5',
							usage: { input_tokens: 10, output_tokens: 5 },
						},
						{
							model: 'claude-sonnet-5',
							usage: { input_tokens: 20, output_tokens: 7 },
						},
					],
				},
			},
			triage: {
				skillName: 'guideline-qa',
				responseLevel: 'deep',
				taskType: 'lookup',
				risk: 'low',
				confidence: 80,
				executionModel: 'opus-5.0',
				toolScope: 'read',
				reviewRequired: false,
				clarificationRequired: false,
				classifierModel: 'claude-haiku-4-5, claude-sonnet-5',
				inputTokens: 30,
				outputTokens: 12,
				totalTokens: 42,
				cacheReadInputTokens: 1,
				cacheWriteInputTokens: 1,
				reasoningTokens: 1,
			},
			usedTools: [
				{ name: 'loadSkill', callCount: 2 },
				{ name: 'searchGuidelines', callCount: 1 },
			],
			usedSkills: [{ name: 'guideline-qa', callCount: 1 }],
		})
	})
})
