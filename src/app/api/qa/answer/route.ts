import config from '@payload-config'
import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	toUIMessageStream,
	type UIMessage,
} from 'ai'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { AgentConfigurationError } from '@/lib/errors'
import { generateAnswerService } from '@/services/generate-answer.service'

export const maxDuration = 30

const qaAnswerRequestSchema = z.object({
	messages: z
		.array(z.custom<UIMessage>((value) => typeof value === 'object' && value !== null))
		.min(1),
	pagePath: z.string().max(300).optional(),
})

export async function POST(req: Request) {
	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	// Agent 질의도 내부 사용자 요청만 허용한다.
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = qaAnswerRequestSchema.safeParse(await req.json())

	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	try {
		const result = await generateAnswerService.execute({
			messages: await convertToModelMessages(parsed.data.messages),
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
