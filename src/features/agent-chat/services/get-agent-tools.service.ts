import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import type { GetAgentGuidelineContext } from './get-agent-guideline-context.service'

/**
 * Agent answer stream에 전달할 AI SDK tool set을 만든다.
 * 실제 guideline I/O는 주입된 guideline context service가 담당한다.
 */
export function getAgentTools(input: {
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
