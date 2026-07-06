import { anthropic } from '@ai-sdk/anthropic'
import { type InferAgentUIMessage, isStepCount, ToolLoopAgent } from 'ai'
import { z } from 'zod'
import { findEnabledAgentSkillSummaries } from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { getAgentDefaultInstructions } from '@/features/agent-chat/services/get-agent-default-instructions.service'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'
import { AgentConfigurationError } from '@/lib/errors'
import { DEFAULT_LOCALE } from '@/lib/locale'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

const agentChatCallOptionsSchema = z.object({
	locale: z.enum(['ko', 'en']).optional(),
	pagePath: z.string().max(300).optional(),
	requestId: z.string().min(1).optional(),
	user: z.unknown(),
})

type AgentChatCallOptions = z.infer<typeof agentChatCallOptionsSchema>
type AgentChatRuntimeContext = {
	locale: 'ko' | 'en'
	pagePath?: string
	requestId: string
}

/** provider 자격 증명은 agent가 소유한다 — route는 던져진 설정 오류를 HTTP 응답으로 매핑만 한다. */
export function assertAgentChatProviderConfigured() {
	if (!process.env.ANTHROPIC_API_KEY) {
		throw new AgentConfigurationError()
	}
}

/** 모든 tool은 동일한 user 컨텍스트를 받는다 — tool 추가 시 여기 한 곳만 따라간다. */
function toolsContextFor(user: unknown) {
	return Object.fromEntries(
		Object.keys(getAgentTools()).map((toolName) => [toolName, { user }]),
	) as Record<keyof ReturnType<typeof getAgentTools>, { user: unknown }>
}

/**
 * Guideline 질의응답 agent 실행 단위 (모델·tool·skill 지시문 구성).
 * Payload skill/guideline I/O는 agent-chat repository가, provider 호출은 AI SDK가 소유한다.
 */
export const agentChatAgent = new ToolLoopAgent<
	AgentChatCallOptions,
	ReturnType<typeof getAgentTools>,
	AgentChatRuntimeContext
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
	// ponytail: AI SDK requires constructor toolsContext; prepareCall replaces it per request.
	toolsContext: toolsContextFor(null),
	callOptionsSchema: agentChatCallOptionsSchema,
	stopWhen: isStepCount(10),
	prepareStep: ({ stepNumber }) =>
		stepNumber === 0
			? {
					activeTools: ['loadSkill'],
					toolChoice: { type: 'tool', toolName: 'loadSkill' },
				}
			: undefined,
	prepareCall: async ({ options = { user: null }, ...settings }) => {
		const [skills, defaultInstructions] = await Promise.all([
			findEnabledAgentSkillSummaries(options.user),
			getAgentDefaultInstructions(options.user),
		])

		if (skills.length === 0) {
			throw new AgentConfigurationError('Agent skill is not configured.')
		}

		const pageContext = options.pagePath
			? `Current guideline page: ${options.pagePath}`
			: undefined

		return {
			...settings,
			instructions: [
				defaultInstructions,
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
			toolsContext: toolsContextFor(options.user),
		}
	},
})

export type AgentChatMessage = InferAgentUIMessage<typeof agentChatAgent>

function formatAgentSkillSelectionInstructions(
	skills: Awaited<ReturnType<typeof findEnabledAgentSkillSummaries>>,
) {
	const lines = skills.map((skill) => `- ${skill.name}: ${skill.description}`)

	return [
		'Before answering, choose exactly one skill from the list below and call loadSkill with its name.',
		'Choose by matching the user request to the skill description. Prefer template or asset skills for requests about what can be made, what should be made, creating assets, filling template slots, exporting images, or downloading results.',
		'Prefer guideline skills only for questions about published brand rules, guideline pages, sections, or usage standards.',
		'After loadSkill returns, follow its instructions field as the active skill instructions.',
		'Available skills:',
		...lines,
	].join('\n')
}
