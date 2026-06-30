import { describe, expect, it, vi } from 'vitest'
import type {
	GetAgentGuidelineContext,
	GuidelineDocumentInput,
	GuidelineSearchInput,
} from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { extractTextFromLexical } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'

function createFakeGetAgentGuidelineContext(): GetAgentGuidelineContext {
	return {
		listPages: vi.fn(async () => [{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }]),
		search: vi.fn(async (_input: GuidelineSearchInput) => []),
		readDocument: vi.fn(async (_input: GuidelineDocumentInput) => null),
	}
}

describe('agent tools', () => {
	it('lists guideline pages through the tool service', async () => {
		const service = createFakeGetAgentGuidelineContext()
		const tools = getAgentTools({ getAgentGuidelineContextService: service })

		const result = await tools.listGuidelinePages.execute?.({}, {} as never)

		expect(service.listPages).toHaveBeenCalled()
		expect(result).toEqual([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
	})

	it('reads guideline document details through the tool service', async () => {
		const service = createFakeGetAgentGuidelineContext()
		const tools = getAgentTools({ getAgentGuidelineContextService: service })

		await tools.readGuidelineDocument.execute?.(
			{
				collection: 'guideline-pages',
				id: '7',
			},
			{} as never,
		)

		expect(service.readDocument).toHaveBeenCalledWith({
			collection: 'guideline-pages',
			id: '7',
		})
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
