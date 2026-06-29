import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import type { GuidelineSearchRepository } from '@/repositories/guideline-search.repository'

export function createAgentTools(input: { guidelineSearchRepository: GuidelineSearchRepository }) {
	return {
		searchGuidelines: tool({
			description: 'Search published brand guideline pages and sections.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			execute: ({ query }) => input.guidelineSearchRepository.search({ query }),
		}),
	} satisfies ToolSet
}
