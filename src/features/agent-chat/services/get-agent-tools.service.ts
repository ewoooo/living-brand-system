import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import { GetAgentGuidelineContextService } from './get-agent-guideline-context.service'

const guidelineToolContextSchema = z.object({
	user: z.unknown(),
})

/**
 * Agent answer stream에 전달할 AI SDK tool set을 만든다.
 * 실제 guideline I/O는 tool 실행 시 주입되는 user context로 수행한다.
 */
export function getAgentTools() {
	return {
		listGuidelinePages: tool({
			description: 'List published brand guideline sections and pages available to read.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) =>
				new GetAgentGuidelineContextService(context.user).listPages(),
		}),
		searchGuidelines: tool({
			description: 'Search published brand guideline pages and sections.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ query }, { context }) =>
				new GetAgentGuidelineContextService(context.user).search({ query }),
		}),
		readGuidelineDocument: tool({
			description: 'Read a published guideline page or section returned by searchGuidelines.',
			inputSchema: z.object({
				collection: z.enum(['guideline-pages', 'sections']),
				id: z.string().min(1),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ collection, id }, { context }) =>
				new GetAgentGuidelineContextService(context.user).readDocument({ collection, id }),
		}),
	} satisfies ToolSet
}
