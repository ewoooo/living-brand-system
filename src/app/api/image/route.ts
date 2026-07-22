import { z } from 'zod'
import { env } from '@/env'
import {
	generateImageCandidates,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	ImagePromptNormalizationUnavailableError,
} from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const requestSchema = z.object({
	prompt: z.string().trim().min(1).max(500),
	count: z.number().int().min(1).max(6).default(4),
	profileId: z.number().int().positive().optional(),
})

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = requestSchema.safeParse(await request.json().catch(() => null))
	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const { prompt: userInput, count, profileId } = parsed.data

	try {
		const result = await generateImageCandidates({
			userInput,
			profileId,
			user,
			count,
		})
		if (result.images.length === 0) {
			return Response.json({ message: 'Image generation failed.' }, { status: 502 })
		}
		payload.logger.info(
			{
				profileId: result.profileId,
				provider: env.OPENAI_API_KEY ? 'gpt-image' : 'pollinations',
				promptLength: result.prompt.length,
				count: result.images.length,
			},
			'image-generation.done',
		)
		return Response.json(result)
	} catch (error) {
		payload.logger.error({ err: error }, 'image-generation.failed')
		if (
			error instanceof ImageGenerationUnavailableError ||
			error instanceof ImagePromptNormalizationUnavailableError
		) {
			return Response.json({ message: 'Image generation is unavailable.' }, { status: 503 })
		}
		if (error instanceof ImageProfileNotFoundError) {
			return Response.json({ message: 'Image profile not found.' }, { status: 404 })
		}
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
