import { z } from 'zod'

import {
	createAgentChatResponse,
	validateAgentChatMessages,
} from '@/features/agent-chat/services/create-agent-chat-response.service'
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
	locale: z.enum(['ko', 'en']).optional(),
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
		return await createAgentChatResponse({
			locale: parsed.data.locale,
			messages: validatedMessages.data,
			pagePath: parsed.data.pagePath,
			requestId,
			user,
		})
	} catch (error) {
		payload.logger.error({ err: error, requestId }, 'agent-chat.request.failed')

		if (error instanceof AgentConfigurationError) {
			// Route는 provider 환경변수 이름을 알지 않고 서비스 설정 실패만 변환한다.
			return Response.json({ message: error.message }, { status: 503 })
		}

		throw error
	}
}
