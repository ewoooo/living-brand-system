import type { AgentQueryTriageDecision } from '@/features/agent-chat/domain/agent-query-triage'

export type AgentChatReaction = 'good' | 'bad'

export interface AgentChatSessionUsage {
	name: string
	callCount?: number
}

export interface AgentChatAiUsage {
	model?: string
	callCount?: number
	inputTokens?: number
	outputTokens?: number
	totalTokens?: number
	cacheReadInputTokens?: number
	cacheWriteInputTokens?: number
	reasoningTokens?: number
	rawUsage?: Record<string, unknown>
}

export interface AgentChatTriage {
	skillName: string
	responseLevel: AgentQueryTriageDecision['responseLevel']
	taskType: AgentQueryTriageDecision['taskType']
	risk: AgentQueryTriageDecision['risk']
	confidence: number
	executionModel: AgentQueryTriageDecision['model']
	toolScope: AgentQueryTriageDecision['toolScope']
	reviewRequired: boolean
	clarificationRequired: boolean
	classifierModel: string
	inputTokens: number
	outputTokens: number
	totalTokens: number
	cacheReadInputTokens: number
	cacheWriteInputTokens: number
	reasoningTokens: number
}

export interface AgentChatSessionMessageInput {
	messageId: string
	role: 'system' | 'user' | 'assistant'
	text?: string
	usedSkills?: AgentChatSessionUsage[]
	usedTools?: AgentChatSessionUsage[]
	aiUsage?: AgentChatAiUsage
	reaction?: AgentChatReaction
	reactedAt?: string
}
