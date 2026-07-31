import { agentQueryTriageDecisionSchema } from '@/features/agent-chat/domain/agent-query-triage'
import type {
	AgentChatAiUsage,
	AgentChatSessionUsage,
	AgentChatTriage,
} from '@/features/agent-chat/types'

interface LanguageModelUsageLike {
	inputTokenDetails: {
		[key: string]: number | undefined
		cacheReadTokens?: number
		cacheWriteTokens?: number
	}
	inputTokens?: number
	outputTokenDetails: {
		[key: string]: number | undefined
		reasoningTokens?: number
	}
	outputTokens?: number
	raw?: unknown
	totalTokens?: number
}

interface ToolCallLike {
	toolName?: unknown
}

interface ToolResultLike {
	output?: unknown
	toolName?: unknown
}

export interface AgentChatSessionUsageStep {
	model: { modelId: string }
	response?: { modelId?: string }
	toolCalls?: readonly unknown[]
	toolResults?: readonly unknown[]
	usage?: LanguageModelUsageLike
}

export interface AgentChatSessionUsageSnapshot {
	aiUsage?: AgentChatAiUsage
	triage?: AgentChatTriage
	usedSkills: AgentChatSessionUsage[]
	usedTools: AgentChatSessionUsage[]
}

/** Agent 채팅 세션의 AI 스텝에서 token·tool·skill 사용량을 누적한다. */
export function createAgentChatSessionUsageCollector() {
	const toolCounts = new Map<string, number>()
	const skillCounts = new Map<string, number>()
	const models = new Set<string>()
	const usage = createEmptyUsage()
	const rawUsages: unknown[] = []
	const triageModels = new Set<string>()
	const triageUsage = createEmptyUsage()
	let triage: AgentChatTriage | undefined

	return {
		addStep(step: AgentChatSessionUsageStep) {
			const model = step.response?.modelId ?? step.model?.modelId
			if (model) models.add(model)
			if (step.usage) addUsage(usage, step.usage)
			if (step.usage?.raw) {
				rawUsages.push({
					...(model ? { model } : {}),
					usage: step.usage.raw,
				})
			}
			const loadSkillResults = (step.toolResults ?? [])
				.map((toolResult) => toolResult as ToolResultLike)
				.filter((result) => result.toolName === 'loadSkill')
			if (loadSkillResults.length > 0) {
				if (model) triageModels.add(model)
				if (step.usage) addUsage(triageUsage, step.usage)
			}

			for (const result of loadSkillResults) {
				const skillName = readSkillName(result.output)
				if (skillName) increment(skillCounts, skillName)
				if (triage) continue
				const decision = agentQueryTriageDecisionSchema.safeParse(result.output)
				if (!decision.success) continue

				triage = {
					skillName: decision.data.name,
					responseLevel: decision.data.responseLevel,
					taskType: decision.data.taskType,
					risk: decision.data.risk,
					confidence: decision.data.confidence,
					executionModel: decision.data.model,
					toolScope: decision.data.toolScope,
					reviewRequired: decision.data.reviewRequired,
					clarificationRequired: decision.data.clarificationRequired,
					classifierModel: [...triageModels].join(', '),
					inputTokens: triageUsage.inputTokens,
					outputTokens: triageUsage.outputTokens,
					totalTokens: triageUsage.totalTokens,
					cacheReadInputTokens: triageUsage.cacheReadInputTokens,
					cacheWriteInputTokens: triageUsage.cacheWriteInputTokens,
					reasoningTokens: triageUsage.reasoningTokens,
				}
			}

			for (const toolCall of step.toolCalls ?? []) {
				const call = toolCall as ToolCallLike
				if (typeof call.toolName !== 'string') continue
				increment(toolCounts, call.toolName)
			}
		},
		snapshot(): AgentChatSessionUsageSnapshot {
			const model = models.size > 0 ? [...models].join(', ') : undefined
			const aiUsage: AgentChatAiUsage | undefined =
				usage.callCount > 0 ? { model, ...usage } : undefined
			if (aiUsage && rawUsages.length > 0) {
				aiUsage.rawUsage = { steps: rawUsages }
			}

			return {
				aiUsage,
				triage,
				usedTools: toUsage(toolCounts),
				usedSkills: toUsage(skillCounts),
			}
		},
	}
}

function increment(counts: Map<string, number>, key: string) {
	counts.set(key, (counts.get(key) ?? 0) + 1)
}

function toUsage(counts: Map<string, number>) {
	return [...counts.entries()].map(([name, callCount]) => ({ name, callCount }))
}

function readSkillName(input: unknown) {
	if (!input || typeof input !== 'object' || !('name' in input)) return null
	const name = (input as { name?: unknown }).name
	return typeof name === 'string' ? name : null
}

function createEmptyUsage(): Required<Omit<AgentChatAiUsage, 'model' | 'rawUsage'>> {
	return {
		callCount: 0,
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
		cacheReadInputTokens: 0,
		cacheWriteInputTokens: 0,
		reasoningTokens: 0,
	}
}

function addUsage(target: ReturnType<typeof createEmptyUsage>, usage: LanguageModelUsageLike) {
	target.callCount += 1
	target.inputTokens += usage.inputTokens ?? 0
	target.outputTokens += usage.outputTokens ?? 0
	target.totalTokens += usage.totalTokens ?? 0
	target.cacheReadInputTokens += usage.inputTokenDetails.cacheReadTokens ?? 0
	target.cacheWriteInputTokens += usage.inputTokenDetails.cacheWriteTokens ?? 0
	target.reasoningTokens += usage.outputTokenDetails.reasoningTokens ?? 0
}
