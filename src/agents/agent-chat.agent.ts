import { anthropic } from '@ai-sdk/anthropic'
import { type InferAgentUIMessage, isStepCount, ToolLoopAgent } from 'ai'
import { z } from 'zod'
import { getAgentTools } from '@/agents/agent-chat-tools.agent'
import { env } from '@/env'
import {
	type AgentQueryTriageState,
	isAgentQueryTriageVerification,
} from '@/features/agent-chat/domain/agent-query-triage'
import { getAgentExecutionPolicy } from '@/features/agent-chat/domain/agent-skill-tool-policy'
import { findEnabledAgentSkillSummaries } from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { getAgentDefaultInstructions } from '@/features/agent-chat/services/get-agent-default-instructions.service'
import type { AgentChatReaction } from '@/features/agent-chat/types'
import { AgentConfigurationError } from '@/lib/errors'

const DEFAULT_MODEL = 'claude-sonnet-5'
const TRIAGE_MODEL = 'claude-haiku-4-5'
const TRIAGE_VERIFICATION_MODEL = 'claude-sonnet-5'
const DEFAULT_PROVIDER_OPTIONS = {
	anthropic: {
		effort: 'medium',
		thinking: { type: 'adaptive', display: 'summarized' },
	},
} as const
const HAIKU_PROVIDER_OPTIONS = {
	anthropic: { thinking: { type: 'disabled' } },
} as const

const agentChatCallOptionsSchema = z.object({
	agentChatSessionId: z.number().int().positive().optional(),
	pagePath: z.string().max(300).optional(),
	user: z.unknown(),
})

type AgentChatCallOptions = z.infer<typeof agentChatCallOptionsSchema>
type AgentToolContext = AgentChatCallOptions & { triageState: AgentQueryTriageState }

/** provider 자격 증명은 agent가 소유한다 — route는 던져진 설정 오류를 HTTP 응답으로 매핑만 한다. */
export function assertAgentChatProviderConfigured() {
	if (!env.ANTHROPIC_API_KEY) {
		throw new AgentConfigurationError()
	}
}

/** 모든 tool은 동일한 요청 컨텍스트를 받는다 — tool 추가 시 여기 한 곳만 따라간다. */
function toolsContextFor(context: AgentChatCallOptions) {
	const triageState: AgentQueryTriageState = {}
	return Object.fromEntries(
		Object.keys(getAgentTools()).map((toolName) => [toolName, { ...context, triageState }]),
	) as Record<keyof ReturnType<typeof getAgentTools>, AgentToolContext>
}

/**
 * Guideline 질의응답 agent 실행 단위 (모델·tool·skill 지시문 구성).
 * Payload skill/guideline I/O는 agent-chat repository가, provider 호출은 AI SDK가 소유한다.
 */
export const agentChatAgent = new ToolLoopAgent<
	AgentChatCallOptions,
	ReturnType<typeof getAgentTools>
>({
	model: anthropic(env.CHAT_MODEL || DEFAULT_MODEL),
	reasoning: 'medium',
	tools: getAgentTools(),
	// ponytail: AI SDK requires constructor toolsContext; prepareCall replaces it per request.
	toolsContext: toolsContextFor({ user: null }),
	callOptionsSchema: agentChatCallOptionsSchema,
	stopWhen: isStepCount(10),
	prepareStep: ({ stepNumber, steps }) => {
		if (stepNumber === 0) {
			const triageEnabled = env.AGENT_CHAT_TRIAGE_ENABLED === 'true'
			return {
				activeTools: ['loadSkill'],
				...(triageEnabled ? { model: anthropic(TRIAGE_MODEL) } : {}),
				providerOptions: triageEnabled ? HAIKU_PROVIDER_OPTIONS : DEFAULT_PROVIDER_OPTIONS,
				toolChoice: { type: 'tool', toolName: 'loadSkill' },
			}
		}

		const loadedSkill = steps
			.flatMap((step) => step.toolResults)
			.filter((result) => result.dynamic !== true && result.toolName === 'loadSkill')
			.at(-1)

		if (!loadedSkill) {
			return { activeTools: [], providerOptions: DEFAULT_PROVIDER_OPTIONS }
		}
		if (isAgentQueryTriageVerification(loadedSkill.output)) {
			return {
				activeTools: ['loadSkill'],
				model: anthropic(TRIAGE_VERIFICATION_MODEL),
				providerOptions: DEFAULT_PROVIDER_OPTIONS,
				toolChoice: { type: 'tool', toolName: 'loadSkill' },
			}
		}

		const execution = getAgentExecutionPolicy(loadedSkill.output)

		return {
			activeTools: execution.activeTools,
			model: anthropic(execution.modelId),
			providerOptions:
				execution.modelId === TRIAGE_MODEL
					? HAIKU_PROVIDER_OPTIONS
					: DEFAULT_PROVIDER_OPTIONS,
		}
	},
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
			toolsContext: toolsContextFor(options),
		}
	},
})

export interface AgentChatMessageMetadata {
	agentChatMessageId?: string
	agentChatSessionId?: number
	reaction?: AgentChatReaction
}

export type AgentChatMessage = InferAgentUIMessage<typeof agentChatAgent, AgentChatMessageMetadata>

function formatAgentSkillSelectionInstructions(
	skills: Awaited<ReturnType<typeof findEnabledAgentSkillSummaries>>,
) {
	const lines = skills.map((skill) => `- ${skill.name}: ${skill.description}`)
	const triageInstructions =
		env.AGENT_CHAT_TRIAGE_ENABLED === 'true'
			? [
					'Before answering, classify the request and call loadSkill with name, responseLevel, taskType, risk, and confidence.',
					'Use responseLevel fast for a simple one-step response, standard for a focused normal response, and deep for multi-step, multi-source, conflicting, or high-stakes work.',
					'Use taskType answer when no tool is needed, lookup when read tools are needed, and action when an output must be created or changed.',
					'Use risk high when an incorrect answer or action could cause material, privacy, security, compliance, or irreversible impact; otherwise use low. confidence must be an integer from 0 to 100.',
					'If loadSkill returns verificationRequired, classify the original request once more and call loadSkill again.',
					'If the final loadSkill result has clarificationRequired true, ask exactly one concise clarification question and do not complete the request.',
				]
			: ['Before answering, call loadSkill once with the matching skill name.']

	return [
		...triageInstructions,
		'Choose by matching the user request to the skill description. Prefer template or asset skills for requests about what can be made, what should be made, creating assets, filling template slots, exporting images, or downloading results.',
		'Prefer guideline skills only for questions about published brand rules, guideline pages, sections, or usage standards.',
		'After loadSkill returns, follow its instructions field as the active skill instructions.',
		'Available skills:',
		...lines,
	].join('\n')
}
