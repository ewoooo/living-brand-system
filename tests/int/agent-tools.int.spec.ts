import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAgentMessageText } from '@/features/agent-chat/get-agent-message-text'
import * as agentSkillRepository from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import type { AgentChatMessage } from '@/features/agent-chat/services/create-agent-chat-response.service'
import { validateAgentChatMessages } from '@/features/agent-chat/services/create-agent-chat-response.service'
import * as agentGuidelineContext from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { extractTextFromLexical } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'

describe('agent tools', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('lists guideline pages through the tool service', async () => {
		const listPages = vi
			.spyOn(agentGuidelineContext, 'listAgentGuidelinePages')
			.mockResolvedValue([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
		const tools = getAgentTools()

		const result = await tools.listGuidelinePages.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(listPages).toHaveBeenCalled()
		expect(result).toEqual([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
	})

	it('loads agent skill instructions through the tool service', async () => {
		const findSkill = vi
			.spyOn(agentSkillRepository, 'findEnabledAgentSkillByName')
			.mockResolvedValue({
				body: 'Rewrite campaign copy.',
				description: 'Copywriting test skill.',
				name: 'copywriter-test',
				references: [],
			})
		const tools = getAgentTools()

		const result = await tools.loadSkill.execute?.({ name: 'copywriter-test' }, {
			context: { user: { id: 1 } },
		} as never)

		expect(findSkill).toHaveBeenCalledWith({ id: 1 }, 'copywriter-test')
		expect(result).toEqual({
			description: 'Copywriting test skill.',
			instructions: 'Rewrite campaign copy.',
			name: 'copywriter-test',
		})
	})

	it('reads guideline document details through the tool service', async () => {
		const readDocument = vi
			.spyOn(agentGuidelineContext, 'readAgentGuidelineDocument')
			.mockResolvedValue(null)
		const tools = getAgentTools()

		await tools.readGuidelineDocument.execute?.(
			{
				collection: 'guideline-pages',
				id: '7',
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(readDocument).toHaveBeenCalledWith(
			{ id: 1 },
			{
				collection: 'guideline-pages',
				id: '7',
			},
		)
	})

	it('rejects invalid tool message input before streaming', async () => {
		const result = await validateAgentChatMessages([
			{
				id: 'message-1',
				role: 'assistant',
				parts: [
					{
						type: 'tool-searchGuidelines',
						toolCallId: 'tool-call-1',
						state: 'input-available',
						input: { query: '' },
					},
				],
			},
		])

		expect(result.success).toBe(false)
	})

	it('extracts text from lexical rich text nodes', () => {
		const text = extractTextFromLexical({
			root: {
				children: [{ text: 'Logo' }, { children: [{ text: 'minimum size' }] }],
			},
		})

		expect(text).toBe('Logo minimum size')
	})

	it('renders structured agent output as answer text', () => {
		const text = getAgentMessageText({
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: JSON.stringify({
						answer: '안녕하세요.',
						citations: [],
						needsHumanReview: false,
					}),
				},
			],
		} as AgentChatMessage)

		expect(text).toBe('안녕하세요.')
	})

	it('renders partial structured agent output while streaming', () => {
		const text = getAgentMessageText({
			role: 'assistant',
			parts: [{ type: 'text', text: '{"answer":"안녕하세요!\\n브랜드' }],
		} as AgentChatMessage)

		expect(text).toBe('안녕하세요!\n브랜드')
	})
})
