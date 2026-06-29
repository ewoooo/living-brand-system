import config from '@payload-config'
import { convertToModelMessages, createUIMessageStreamResponse, type UIMessage } from 'ai'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { AnthropicAiRepository } from '@/repositories/anthropic-ai.repository'
import { GenerateAnswerService } from '@/services/generate-answer.service'

export const maxDuration = 30

const qaAnswerRequestSchema = z.object({
	messages: z
		.array(z.custom<UIMessage>((value) => typeof value === 'object' && value !== null))
		.min(1),
	pagePath: z.string().max(300).optional(),
})

const generateAnswerService = new GenerateAnswerService(new AnthropicAiRepository())

export async function POST(req: Request) {
	if (!process.env.ANTHROPIC_API_KEY) {
		return Response.json({ message: 'ANTHROPIC_API_KEY is not configured.' }, { status: 503 })
	}

	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = qaAnswerRequestSchema.safeParse(await req.json())

	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const result = generateAnswerService.execute({
		messages: await convertToModelMessages(parsed.data.messages),
		pagePath: parsed.data.pagePath,
	})

	return createUIMessageStreamResponse({
		stream: result.toUIMessageStream(),
	})
}
