import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import type { GetAgentGuidelineContext } from '@/features/agent-chat/services/get-agent-guideline-context.service'

/**
 * Agent가 사용할 tool 계약만 만든다.
 * 실제 guideline I/O와 tool 출력 조립은 주입된 GetAgentGuidelineContext service가 담당한다.
 */
export function createAgentTools(input: {
	getAgentGuidelineContextService: GetAgentGuidelineContext
}) {
	return {
		listGuidelinePages: tool({
			description: 'List published brand guideline sections and pages available to read.',
			inputSchema: z.object({}),
			execute: () => input.getAgentGuidelineContextService.listPages(),
		}),
		searchGuidelines: tool({
			description: 'Search published brand guideline pages and sections.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			execute: ({ query }) => input.getAgentGuidelineContextService.search({ query }),
		}),
		readGuidelineDocument: tool({
			description: 'Read a published guideline page or section returned by searchGuidelines.',
			inputSchema: z.object({
				collection: z.enum(['guideline-pages', 'sections']),
				id: z.string().min(1),
			}),
			execute: ({ collection, id }) =>
				input.getAgentGuidelineContextService.readDocument({ collection, id }),
		}),
	} satisfies ToolSet
}
