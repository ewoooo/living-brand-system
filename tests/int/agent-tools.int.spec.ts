import { describe, expect, it, vi } from 'vitest'
import { createAgentTools } from '@/agents/agent-tools'
import { extractTextFromLexical } from '@/repositories/guideline-search.payload.repository'
import type {
	GuidelineDocumentInput,
	GuidelineSearchInput,
	GuidelineSearchRepository,
} from '@/repositories/guideline-search.repository'

class FakeGuidelineSearchRepository implements GuidelineSearchRepository {
	search = vi.fn(async (_input: GuidelineSearchInput) => [])
	readDocument = vi.fn(async (_input: GuidelineDocumentInput) => null)
}

describe('agent tools', () => {
	it('reads guideline document details through the repository', async () => {
		const repository = new FakeGuidelineSearchRepository()
		const tools = createAgentTools({ guidelineSearchRepository: repository })

		await tools.readGuidelineDocument.execute?.(
			{
				collection: 'guideline-pages',
				id: '7',
			},
			{} as never,
		)

		expect(repository.readDocument).toHaveBeenCalledWith({
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
