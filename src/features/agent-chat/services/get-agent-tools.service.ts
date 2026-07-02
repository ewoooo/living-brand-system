import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import {
	type AgentSkillDetail,
	findEnabledAgentSkillByName,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { AgentConfigurationError } from '@/lib/errors'
import { findAgentRules } from '../repositories/agent-guideline-context.payload.repository'
import { formatAgentSkillInstructions } from './format-agent-skill-instructions.service'
import {
	listAgentGuidelinePages,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from './get-agent-guideline-context.service'

const guidelineToolContextSchema = z.object({
	user: z.unknown(),
})

/**
 * Agent answer stream에 전달할 AI SDK tool set을 만든다.
 * 실제 skill/guideline I/O는 tool 실행 시 주입되는 user context로 수행한다.
 */
export function getAgentTools() {
	return {
		loadSkill: tool({
			description: 'Load the full instructions for an enabled agent skill by name.',
			inputSchema: z.object({
				name: z.string().min(1).max(80),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: async ({ name }, { context }) => {
				const skill = await findEnabledAgentSkillByName(context.user, name)

				if (!skill) {
					throw new AgentConfigurationError('Agent skill is not configured.')
				}

				return formatLoadedSkill(skill)
			},
		}),
		listGuidelinePages: tool({
			description: 'List published brand guideline sections and pages available to read.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => listAgentGuidelinePages(context.user),
		}),
		searchGuidelines: tool({
			description: 'Search published brand guideline pages and sections.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ query }, { context }) => searchAgentGuidelines(context.user, { query }),
		}),
		readGuidelineDocument: tool({
			description: 'Read a published guideline page or section returned by searchGuidelines.',
			inputSchema: z.object({
				collection: z.enum(['guideline-pages', 'sections']),
				id: z.string().min(1),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ collection, id }, { context }) =>
				readAgentGuidelineDocument(context.user, { collection, id }),
		}),
		getRuleCatalog: tool({
			description: 'Get the live built-in rule preset catalog registered in Payload.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => findAgentRules(context.user),
		}),
	} satisfies ToolSet
}

function formatLoadedSkill(skill: AgentSkillDetail) {
	return {
		name: skill.name,
		description: skill.description,
		instructions: formatAgentSkillInstructions(skill),
	}
}
