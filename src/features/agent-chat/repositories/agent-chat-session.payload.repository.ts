import config from '@payload-config'
import { getPayload } from 'payload'
import type { AgentChatSession, User } from '@/payload-types'

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

interface CreateAgentChatSessionInput {
	messages?: AgentChatSessionMessageInput[]
	messageCount?: number
	pagePath?: string
	status: AgentChatSession['status']
	user: User
}

interface UpdateAgentChatSessionInput {
	id: AgentChatSession['id']
	status: AgentChatSession['status']
	messages?: AgentChatSessionMessageInput[]
	messageCount?: number
	usedSkills?: AgentChatSessionUsage[]
	usedTools?: AgentChatSessionUsage[]
	aiUsage?: AgentChatAiUsage
	errorMessage?: string
	user: User
}

interface UpdateAgentChatSessionReactionInput {
	id: AgentChatSession['id']
	messageId: string
	reaction: AgentChatReaction
	user: User
}

/**
 * AgentChatSession 저장 repository — 채팅 실행 기록의 Payload Local API 쓰기를 소유한다.
 */
export async function createAgentChatSessionRecord(input: CreateAgentChatSessionInput) {
	const payload = await getPayload({ config })

	return payload.create({
		collection: 'agent-chat-sessions',
		data: {
			status: input.status,
			pagePath: input.pagePath,
			messageCount: input.messageCount,
			messages: input.messages,
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
	})
}

/**
 * AgentChatSession 상태 갱신 repository — 실행 중 세션의 완료/실패 메타데이터만 저장한다.
 */
export async function updateAgentChatSessionRecord(input: UpdateAgentChatSessionInput) {
	const payload = await getPayload({ config })

	return payload.update({
		collection: 'agent-chat-sessions',
		id: input.id,
		data: {
			status: input.status,
			messages: input.messages,
			messageCount: input.messageCount,
			usedTools: input.usedTools,
			usedSkills: input.usedSkills,
			aiUsage: input.aiUsage,
			errorMessage: input.errorMessage,
			completedAt: input.status === 'running' ? undefined : new Date().toISOString(),
		},
		overrideAccess: true,
		user: input.user,
	})
}

/**
 * AgentChatSession 리액션 저장 repository — 소유 사용자의 피드백 메타데이터만 갱신한다.
 */
export async function updateAgentChatSessionReaction(input: UpdateAgentChatSessionReactionInput) {
	const payload = await getPayload({ config })
	const session = await payload.find({
		collection: 'agent-chat-sessions',
		depth: 0,
		limit: 1,
		overrideAccess: true,
		user: input.user,
		where: {
			and: [{ id: { equals: input.id } }, { createdBy: { equals: input.user.id } }],
		},
	})

	if (!session.docs[0]) return null

	const messages = session.docs[0].messages ?? []
	let targetFound = false
	const reactedAt = new Date().toISOString()
	const nextMessages = messages.map((message) => {
		if (message.messageId !== input.messageId || message.role !== 'assistant') {
			return message
		}

		targetFound = true
		return { ...message, reaction: input.reaction, reactedAt }
	})

	if (!targetFound) return null

	return payload.update({
		collection: 'agent-chat-sessions',
		id: session.docs[0].id,
		data: {
			messages: nextMessages,
		},
		overrideAccess: true,
		user: input.user,
	})
}
