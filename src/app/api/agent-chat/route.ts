import { createAgentUIStreamResponse } from 'ai'
import { z } from 'zod'

import { agentChatAgent, assertAgentChatProviderConfigured } from '@/agents/agent-chat.agent'
import { validateAgentChatMessages } from '@/features/agent-chat/services/validate-agent-chat-messages.service'
import { AgentConfigurationError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/request-auth'

export const maxDuration = 30

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
	const { payload, user } = await authenticateRequest()

	// Agent 질의도 내부 사용자 요청만 허용한다.
	if (!user) {
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

	try {
		// stream 시작 전에 동기로 검증해야 설정 오류를 HTTP 상태로 매핑할 수 있다.
		assertAgentChatProviderConfigured()

		// 스트리밍 Response 생성은 HTTP adapter인 route가 소유한다 (AI SDK 공식 패턴).
		return await createAgentUIStreamResponse({
			agent: agentChatAgent,
			uiMessages: validatedMessages.data,
			options: {
				pagePath: parsed.data.pagePath,
				user,
			},
			onError: () => 'Agent response failed.',
		})
	} catch (error) {
		payload.logger.error({ err: error, requestId }, 'agent-chat.request.failed')

		if (error instanceof AgentConfigurationError) {
			// Route는 provider 환경변수 이름을 알지 않고 서비스 설정 실패만 변환한다.
			return Response.json({ message: error.message }, { status: 503 })
		}

		// 상세 오류는 위 로그에만 남기고 사용자에게는 일반화된 메시지만 반환한다.
		return Response.json({ message: 'Agent response failed.' }, { status: 500 })
	}
}
