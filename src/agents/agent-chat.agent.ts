import { anthropic } from '@ai-sdk/anthropic'
import { type InferAgentUIMessage, isStepCount, Output, ToolLoopAgent } from 'ai'
import { z } from 'zod'
import { findEnabledAgentSkillSummaries } from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'
import { AgentConfigurationError } from '@/lib/errors'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const DEFAULT_LOCALE = 'ko'

const agentChatCallOptionsSchema = z.object({
	locale: z.enum(['ko', 'en']).optional(),
	pagePath: z.string().max(300).optional(),
	requestId: z.string().min(1).optional(),
	user: z.unknown(),
})

const agentChatOutput = Output.object({
	schema: z.object({
		answer: z.string(),
		citations: z.array(
			z.object({
				collection: z.enum(['guideline-pages', 'sections']),
				id: z.string(),
				title: z.string(),
				ruleKeys: z.array(z.string()),
			}),
		),
		needsHumanReview: z.boolean(),
	}),
})

type AgentChatCallOptions = z.infer<typeof agentChatCallOptionsSchema>
type AgentChatRuntimeContext = {
	locale: 'ko' | 'en'
	pagePath?: string
	requestId: string
}

/**
 * Guideline 질의응답 agent 실행 단위 (모델·tool·skill 지시문 구성).
 * Payload skill/guideline I/O는 agent-chat repository가, provider 호출은 AI SDK가 소유한다.
 */
export const agentChatAgent = new ToolLoopAgent<
	AgentChatCallOptions,
	ReturnType<typeof getAgentTools>,
	AgentChatRuntimeContext,
	typeof agentChatOutput
>({
	model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
	providerOptions: {
		anthropic: {
			effort: 'medium',
			thinking: { type: 'adaptive', display: 'summarized' },
		},
	},
	reasoning: 'medium',
	tools: getAgentTools(),
	output: agentChatOutput,
	// ponytail: AI SDK requires constructor toolsContext; prepareCall replaces it per request.
	toolsContext: {
		loadSkill: { user: null },
		getRuleCatalog: { user: null },
		listGuidelinePages: { user: null },
		searchGuidelines: { user: null },
		readGuidelineDocument: { user: null },
	},
	callOptionsSchema: agentChatCallOptionsSchema,
	stopWhen: isStepCount(5),
	prepareStep: ({ stepNumber }) =>
		stepNumber === 0
			? {
					activeTools: ['loadSkill'],
					toolChoice: { type: 'tool', toolName: 'loadSkill' },
				}
			: undefined,
	prepareCall: async ({ options = { user: null }, ...settings }) => {
		const skills = await findEnabledAgentSkillSummaries(options.user)

		if (skills.length === 0) {
			throw new AgentConfigurationError('Agent skill is not configured.')
		}

		const pageContext = options.pagePath
			? `Current guideline page: ${options.pagePath}`
			: undefined

		return {
			...settings,
			instructions: [
				formatAgentSkillSelectionInstructions(skills),
				pageContext ? `Published context:\n${pageContext}` : null,
			]
				.filter(Boolean)
				.join('\n\n'),
			runtimeContext: {
				locale: options.locale ?? DEFAULT_LOCALE,
				pagePath: options.pagePath,
				requestId: options.requestId ?? crypto.randomUUID(),
			},
			toolsContext: {
				loadSkill: { user: options.user },
				getRuleCatalog: { user: options.user },
				listGuidelinePages: { user: options.user },
				searchGuidelines: { user: options.user },
				readGuidelineDocument: { user: options.user },
			},
		}
	},
})

export type AgentChatMessage = InferAgentUIMessage<typeof agentChatAgent>

function formatAgentSkillSelectionInstructions(
	skills: Awaited<ReturnType<typeof findEnabledAgentSkillSummaries>>,
) {
	const lines = skills.map((skill) => {
		const defaultLabel = skill.isDefault ? ' (default)' : ''
		return `- ${skill.name}${defaultLabel}: ${skill.description}`
	})

	return [
		'Before answering, call loadSkill with the single best skill name from the list below.',
		'After loadSkill returns, follow its instructions field as the active skill instructions.',
		'Available skills:',
		...lines,
	].join('\n')
}
