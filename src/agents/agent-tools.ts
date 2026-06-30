import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import type { GuidelineSearchRepository } from '@/repositories/guideline-search.repository'

/**
 * Agent가 사용할 tool 계약만 만든다.
 * 실제 guideline 검색 I/O는 주입된 GuidelineSearchRepository가 담당한다.
 */
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
