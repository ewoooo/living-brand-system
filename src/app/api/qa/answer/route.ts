import config from '@payload-config'
import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	type ModelMessage,
	toUIMessageStream,
	type UIMessage,
} from 'ai'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { runAgentChatService } from '@/features/agent-chat/services/run-agent-chat.service'
import { AgentConfigurationError } from '@/lib/errors'

export const maxDuration = 30

const uiMessageSchema = z
	.object({
		id: z.string().min(1),
		role: z.enum(['system', 'user', 'assistant']),
		parts: z.array(z.object({ type: z.string() }).passthrough()).min(1),
	})
	.passthrough()

const qaAnswerRequestSchema = z.object({
	messages: z.array(uiMessageSchema).min(1),
	pagePath: z.string().max(300).optional(),
})

export async function parseQaAnswerRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return qaAnswerRequestSchema.safeParse(body)
}

export async function POST(req: Request) {
	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	// Agent 질의도 내부 사용자 요청만 허용한다.
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = await parseQaAnswerRequest(req)

	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	let messages: ModelMessage[]

	try {
		messages = await convertToModelMessages(parsed.data.messages as UIMessage[])
	} catch {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	try {
		const result = await runAgentChatService.execute({
			messages,
			pagePath: parsed.data.pagePath,
			user,
		})

		return createUIMessageStreamResponse({
			stream: toUIMessageStream({
				stream: result.stream,
				onError: () => 'Agent response failed.',
			}),
		})
	} catch (error) {
		if (error instanceof AgentConfigurationError) {
			// Route는 provider 환경변수 이름을 알지 않고 서비스 설정 실패만 변환한다.
			return Response.json({ message: error.message }, { status: 503 })
		}

		throw error
	}
}
