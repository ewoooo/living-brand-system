import { z } from 'zod'

export const agentQueryTriageSchema = z.strictObject({
	name: z.string().trim().min(1).max(80),
	responseLevel: z.enum(['fast', 'standard', 'deep']),
	taskType: z.enum(['answer', 'lookup', 'action']),
	risk: z.enum(['low', 'high']),
	confidence: z.number().int().min(0).max(100),
})

export type AgentQueryTriageProposal = z.infer<typeof agentQueryTriageSchema>
export const agentSkillSelectionSchema = agentQueryTriageSchema.pick({ name: true })
export type AgentSkillSelection = z.infer<typeof agentSkillSelectionSchema>

export const AGENT_TRIAGE_CONFIDENCE_THRESHOLD = 70

const modelByResponseLevel = {
	fast: 'haiku-4.5',
	standard: 'sonnet-5',
	deep: 'opus-5.0',
} as const

const toolScopeByTaskType = {
	answer: 'none',
	lookup: 'read',
	action: 'action',
} as const

const responseLevelRank = {
	fast: 0,
	standard: 1,
	deep: 2,
} as const

export const agentQueryTriageDecisionSchema = z.object({
	...agentQueryTriageSchema.shape,
	model: z.enum(['haiku-4.5', 'sonnet-5', 'opus-5.0']),
	toolScope: z.enum(['none', 'read', 'action']),
	reviewRequired: z.boolean(),
	clarificationRequired: z.boolean(),
})

export type AgentQueryTriageDecision = z.infer<typeof agentQueryTriageDecisionSchema>
export const agentQueryTriageVerificationSchema = z.strictObject({
	verificationRequired: z.literal(true),
})
export type AgentQueryTriageVerification = z.infer<typeof agentQueryTriageVerificationSchema>
export type AgentQueryRoutingDecision = Pick<
	AgentQueryTriageDecision,
	'name' | 'model' | 'toolScope'
>
export interface AgentQueryTriageState {
	firstProposal?: AgentQueryTriageProposal
}

export function isAgentQueryTriageVerification(
	value: unknown,
): value is AgentQueryTriageVerification {
	return agentQueryTriageVerificationSchema.safeParse(value).success
}

export function decideAgentQueryTriage(
	proposal: AgentQueryTriageProposal,
	firstProposal?: AgentQueryTriageProposal,
): AgentQueryTriageDecision {
	const responseLevel =
		firstProposal &&
		responseLevelRank[firstProposal.responseLevel] > responseLevelRank[proposal.responseLevel]
			? firstProposal.responseLevel
			: proposal.responseLevel
	const risk = firstProposal?.risk === 'high' ? 'high' : proposal.risk
	const reviewRequired = risk === 'high'
	const clarificationRequired =
		proposal.confidence < AGENT_TRIAGE_CONFIDENCE_THRESHOLD ||
		(firstProposal !== undefined &&
			(firstProposal.name !== proposal.name || firstProposal.taskType !== proposal.taskType))
	const toolScope = toolScopeByTaskType[proposal.taskType]

	return {
		...proposal,
		responseLevel: reviewRequired ? 'deep' : responseLevel,
		risk,
		model: reviewRequired ? 'opus-5.0' : modelByResponseLevel[responseLevel],
		toolScope: clarificationRequired
			? 'none'
			: reviewRequired && toolScope === 'action'
				? 'read'
				: toolScope,
		reviewRequired,
		clarificationRequired,
	}
}

export function decideAgentQueryRouting(
	proposal: AgentSkillSelection | AgentQueryTriageProposal,
	triageEnabled: boolean,
	firstProposal?: AgentQueryTriageProposal,
): AgentQueryRoutingDecision | AgentQueryTriageDecision | AgentQueryTriageVerification {
	if (triageEnabled) {
		const parsedProposal = agentQueryTriageSchema.parse(proposal)
		if (!firstProposal && parsedProposal.confidence < AGENT_TRIAGE_CONFIDENCE_THRESHOLD) {
			return { verificationRequired: true }
		}
		return decideAgentQueryTriage(parsedProposal, firstProposal)
	}

	return {
		name: proposal.name,
		model: 'sonnet-5',
		toolScope: 'action',
	}
}
