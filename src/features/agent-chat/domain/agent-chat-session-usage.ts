import type { LanguageModelResponseMetadata, LanguageModelUsage, StepResult, ToolSet } from 'ai'
import { readSkillName } from '@/features/agent-chat/domain/agent-skill-tool-policy'
import type { AgentChatAiUsage, AgentChatSessionUsage } from '@/features/agent-chat/types'

/** onStepEnd가 주는 AI SDK StepResult 중 사용량 수집에 쓰는 필드만 받는다. */
export type AgentChatSessionUsageStep = Pick<
	StepResult<ToolSet>,
	'model' | 'toolCalls' | 'toolResults' | 'usage'
> & { response?: Pick<LanguageModelResponseMetadata, 'modelId'> }

export interface AgentChatSessionUsageSnapshot {
	aiUsage?: AgentChatAiUsage
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

	return {
		addStep(step: AgentChatSessionUsageStep) {
			const model = step.response?.modelId ?? step.model.modelId
			if (model) models.add(model)
			addUsage(usage, step.usage)
			if (step.usage.raw) {
				rawUsages.push({
					...(model ? { model } : {}),
					usage: step.usage.raw,
				})
			}

			for (const result of step.toolResults) {
				if (result.toolName !== 'loadSkill') continue
				const skillName = readSkillName(result.output)
				if (skillName) increment(skillCounts, skillName)
			}

			for (const toolCall of step.toolCalls) {
				increment(toolCounts, toolCall.toolName)
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

function addUsage(target: ReturnType<typeof createEmptyUsage>, usage: LanguageModelUsage) {
	target.callCount += 1
	target.inputTokens += usage.inputTokens ?? 0
	target.outputTokens += usage.outputTokens ?? 0
	target.totalTokens += usage.totalTokens ?? 0
	target.cacheReadInputTokens += usage.inputTokenDetails.cacheReadTokens ?? 0
	target.cacheWriteInputTokens += usage.inputTokenDetails.cacheWriteTokens ?? 0
	target.reasoningTokens += usage.outputTokenDetails.reasoningTokens ?? 0
}
