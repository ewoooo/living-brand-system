import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateAgentChatMessages } from '@/features/agent-chat/agent-chat-agent'
import {
	extractTextFromLexical,
	GetAgentGuidelineContextService,
} from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'

describe('agent tools', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('lists guideline pages through the tool service', async () => {
		const listPages = vi
			.spyOn(GetAgentGuidelineContextService.prototype, 'listPages')
			.mockResolvedValue([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
		const tools = getAgentTools()

		const result = await tools.listGuidelinePages.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(listPages).toHaveBeenCalled()
		expect(result).toEqual([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
	})

	it('reads guideline document details through the tool service', async () => {
		const readDocument = vi
			.spyOn(GetAgentGuidelineContextService.prototype, 'readDocument')
			.mockResolvedValue(null)
		const tools = getAgentTools()

		await tools.readGuidelineDocument.execute?.(
			{
				collection: 'guideline-pages',
				id: '7',
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(readDocument).toHaveBeenCalledWith({
			collection: 'guideline-pages',
			id: '7',
		})
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
})
