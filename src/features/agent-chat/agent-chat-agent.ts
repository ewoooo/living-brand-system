import { anthropic } from '@ai-sdk/anthropic'
import {
	createAgentUIStreamResponse,
	type InferAgentUIMessage,
	isStepCount,
	safeValidateUIMessages,
	ToolLoopAgent,
} from 'ai'
import { z } from 'zod'
import {
	type AgentSkillId,
	buildAgentInstructions,
	getAgentSkillIds,
	getDefaultAgentSkillId,
} from './agent-skills'
import { getAgentTools } from './services/get-agent-tools.service'

const DEFAULT_MODEL = 'claude-sonnet-4-5'
const DEFAULT_LOCALE = 'ko'

export const agentChatCallOptionsSchema = z.object({
	locale: z.enum(['ko', 'en']).optional(),
	pagePath: z.string().max(300).optional(),
	requestId: z.string().min(1).optional(),
	skillId: z.enum(getAgentSkillIds()).optional(),
	user: z.unknown(),
})

export type AgentChatCallOptions = z.infer<typeof agentChatCallOptionsSchema>
export type AgentChatRuntimeContext = {
	locale: 'ko' | 'en'
	pagePath?: string
	requestId: string
	skillId: AgentSkillId
}

export const agentChatAgent = new ToolLoopAgent<
	AgentChatCallOptions,
	ReturnType<typeof getAgentTools>,
	AgentChatRuntimeContext
>({
	model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
	tools: getAgentTools(),
	// ponytail: AI SDK requires constructor toolsContext; prepareCall replaces it per request.
	toolsContext: {
		listGuidelinePages: { user: null },
		searchGuidelines: { user: null },
		readGuidelineDocument: { user: null },
	},
	callOptionsSchema: agentChatCallOptionsSchema,
	stopWhen: isStepCount(5),
	prepareCall: ({ options = { user: null }, ...settings }) => {
		const skillId = options.skillId ?? getDefaultAgentSkillId()
		const pageContext = options.pagePath
			? `Current guideline page: ${options.pagePath}`
			: undefined

		return {
			...settings,
			instructions: buildAgentInstructions(skillId, pageContext),
			runtimeContext: {
				locale: options.locale ?? DEFAULT_LOCALE,
				pagePath: options.pagePath,
				requestId: options.requestId ?? crypto.randomUUID(),
				skillId,
			},
			toolsContext: {
				listGuidelinePages: { user: options.user },
				searchGuidelines: { user: options.user },
				readGuidelineDocument: { user: options.user },
			},
		}
	},
})

export type AgentChatMessage = InferAgentUIMessage<typeof agentChatAgent>

export function validateAgentChatMessages(messages: unknown) {
	return safeValidateUIMessages<AgentChatMessage>({
		messages,
		// ponytail: UI messages never carry tool context; this mirrors AI SDK's harness cast.
		tools: agentChatAgent.tools as never,
	})
}

export function createAgentChatResponse(input: {
	locale?: AgentChatRuntimeContext['locale']
	messages: AgentChatMessage[]
	pagePath?: string
	requestId: string
	user: unknown
}) {
	return createAgentUIStreamResponse({
		agent: agentChatAgent,
		uiMessages: input.messages,
		options: {
			locale: input.locale,
			pagePath: input.pagePath,
			requestId: input.requestId,
			user: input.user,
		},
		onError: () => 'Agent response failed.',
	})
}
