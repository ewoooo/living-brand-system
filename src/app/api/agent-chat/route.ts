import { createAgentUIStreamResponse } from 'ai'
import { z } from 'zod'

import {
	type AgentChatMessage,
	agentChatAgent,
	assertAgentChatProviderConfigured,
} from '@/agents/agent-chat.agent'
import {
	type AgentChatSessionMessageInput,
	createAgentChatSessionRecord,
	updateAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import {
	type AgentChatSessionUsageSnapshot,
	createAgentChatSessionUsageCollector,
} from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'
import { validateAgentChatMessages } from '@/features/agent-chat/services/validate-agent-chat-messages.service'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-text'
import { AgentConfigurationError } from '@/lib/errors'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import type { User } from '@/payload-types'

export const maxDuration = 30

// 25MB — base64 이미지 첨부(~33% 팽창) 여유. 무제한 JSON 적재 방지 (docs/07 #17).
const MAX_BODY_BYTES = 25_000_000

const uiMessageSchema = z
	.object({
		id: z.string().min(1),
		role: z.enum(['system', 'user', 'assistant']),
		parts: z.array(z.object({ type: z.string() }).passthrough()).min(1),
	})
	.passthrough()

const agentChatRequestSchema = z.object({
	messages: z.array(uiMessageSchema).min(1),
	pagePath: z.string().max(300).optional(),
})

export async function parseAgentChatRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return agentChatRequestSchema.safeParse(body)
}

export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	// content-length 없는(chunked) 요청은 통과한다 — 브라우저 fetch는 항상 길이를 싣는다.
	if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) {
		return Response.json({ message: 'Request is too large.' }, { status: 413 })
	}

	const { payload, user } = await authenticateRequest()

	// Agent 질의도 내부 사용자 요청만 허용한다.
	if (!isPayloadUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = await parseAgentChatRequest(req)

	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const validatedMessages = await validateAgentChatMessages(parsed.data.messages)

	if (!validatedMessages.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const requestId = crypto.randomUUID()
	const assistantMessageId = crypto.randomUUID()
	const requestMessages = toSessionMessages(validatedMessages.data)
	const chatSession = await createAgentChatSessionRecord({
		status: 'running',
		pagePath: parsed.data.pagePath,
		messageCount: requestMessages.length,
		messages: requestMessages,
		user,
	})
	const usageCollector = createAgentChatSessionUsageCollector()
	let assistantText = ''

	const updateChatSession = async (
		status: 'completed' | 'failed' | 'running',
		errorMessage?: string,
	) => {
		const usage = usageCollector.snapshot()
		const messages = toMessagesWithAssistant({
			assistantMessageId,
			assistantText,
			requestMessages,
			usage,
		})

		await updateAgentChatSessionRecord({
			id: chatSession.id,
			status,
			messageCount: messages.length,
			messages,
			usedTools: usage.usedTools,
			usedSkills: usage.usedSkills,
			aiUsage: usage.aiUsage,
			errorMessage,
			user,
		})
	}

	try {
		// stream 시작 전에 동기로 검증해야 설정 오류를 HTTP 상태로 매핑할 수 있다.
		assertAgentChatProviderConfigured()

		// 스트리밍 Response 생성은 HTTP adapter인 route가 소유한다 (AI SDK 공식 패턴).
		return await createAgentUIStreamResponse({
			agent: agentChatAgent,
			uiMessages: validatedMessages.data,
			options: {
				agentChatSessionId: chatSession.id,
				pagePath: parsed.data.pagePath,
				user,
			},
			onStepEnd: async (step) => {
				if ('text' in step && typeof step.text === 'string' && step.text) {
					assistantText = step.text
				}
				usageCollector.addStep(step)
				await updateChatSession(
					step.finishReason === 'tool-calls' ? 'running' : 'completed',
				)
			},
			messageMetadata: ({ part }) =>
				part.type === 'start'
					? { agentChatSessionId: chatSession.id, agentChatMessageId: assistantMessageId }
					: undefined,
			onError: () => {
				void updateChatSession('failed', 'Agent response failed.').catch((error) => {
					payload.logger.error(
						{ err: error, requestId },
						'agent-chat.session-update.failed',
					)
				})
				return 'Agent response failed.'
			},
		})
	} catch (error) {
		await updateChatSession(
			'failed',
			error instanceof Error ? error.message : 'Agent response failed.',
		).catch((updateError) => {
			payload.logger.error(
				{ err: updateError, requestId },
				'agent-chat.session-update.failed',
			)
		})
		payload.logger.error({ err: error, requestId }, 'agent-chat.request.failed')

		if (error instanceof AgentConfigurationError) {
			// Route는 provider 환경변수 이름을 알지 않고 서비스 설정 실패만 변환한다.
			return Response.json({ message: error.message }, { status: 503 })
		}

		// 상세 오류는 위 로그에만 남기고 사용자에게는 일반화된 메시지만 반환한다.
		return Response.json({ message: 'Agent response failed.' }, { status: 500 })
	}
}

function isPayloadUser(user: unknown): user is User {
	return Boolean(user && typeof user === 'object' && 'role' in user && 'email' in user)
}

function toSessionMessages(messages: AgentChatMessage[]): AgentChatSessionMessageInput[] {
	return messages.map((message) => ({
		messageId: message.metadata?.agentChatMessageId ?? message.id,
		role: message.role,
		text: getAgentMessageText(message),
		reaction: message.metadata?.reaction,
	}))
}

function toMessagesWithAssistant(input: {
	assistantMessageId: string
	assistantText: string
	requestMessages: AgentChatSessionMessageInput[]
	usage: AgentChatSessionUsageSnapshot
}): AgentChatSessionMessageInput[] {
	if (
		!input.assistantText &&
		!input.usage.aiUsage &&
		input.usage.usedTools.length === 0 &&
		input.usage.usedSkills.length === 0
	) {
		return input.requestMessages
	}

	return [
		...input.requestMessages,
		{
			messageId: input.assistantMessageId,
			role: 'assistant',
			text: input.assistantText,
			usedTools: input.usage.usedTools,
			usedSkills: input.usage.usedSkills,
			aiUsage: input.usage.aiUsage,
		},
	]
}
