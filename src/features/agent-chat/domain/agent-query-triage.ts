import { z } from 'zod'

export const agentQueryTriageSchema = z.strictObject({
	name: z.string().trim().min(1).max(80),
	responseMode: z.enum(['quick', 'lookup', 'research', 'action']),
	risk: z.enum(['low', 'high']),
	confidence: z.number().int().min(0).max(100),
})

export type AgentQueryTriageProposal = z.infer<typeof agentQueryTriageSchema>

const executionByMode = {
	quick: { model: 'sonnet-4.6', toolScope: 'none' },
	lookup: { model: 'sonnet-4.6', toolScope: 'read' },
	research: { model: 'opus-5.0', toolScope: 'read' },
	action: { model: 'opus-5.0', toolScope: 'action' },
} as const

export type AgentQueryTriageDecision = AgentQueryTriageProposal & {
	model: 'sonnet-4.6' | 'opus-5.0'
	toolScope: 'none' | 'read' | 'action'
	reviewRequired: boolean
}

export function decideAgentQueryTriage(
	proposal: AgentQueryTriageProposal,
): AgentQueryTriageDecision {
	const execution = executionByMode[proposal.responseMode]
	const reviewRequired = proposal.risk === 'high'

	return {
		...proposal,
		model: reviewRequired ? 'opus-5.0' : execution.model,
		toolScope:
			reviewRequired && execution.toolScope === 'action' ? 'read' : execution.toolScope,
		reviewRequired,
	}
}
