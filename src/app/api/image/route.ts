import { z } from 'zod'
import { env } from '@/env'
import { IMAGE_SCENES } from '@/features/image-generation/presets'
import {
	generateImageCandidates,
	ImageGenerationUnavailableError,
} from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const validSceneIds = new Set(['auto', 'free', ...IMAGE_SCENES.map((scene) => scene.id)])
const requestSchema = z.object({
	prompt: z.string().trim().min(1).max(500),
	count: z.number().int().min(1).max(6).default(4),
	sceneId: z
		.string()
		.trim()
		.min(1)
		.max(40)
		.refine((sceneId) => validSceneIds.has(sceneId))
		.optional(),
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

	const { prompt: userInput, count, sceneId } = parsed.data

	try {
		const {
			images,
			prompt,
			sceneId: usedSceneId,
		} = await generateImageCandidates({
			userInput,
			sceneId,
			count,
		})
		if (images.length === 0) {
			return Response.json({ message: 'Image generation failed.' }, { status: 502 })
		}
		payload.logger.info(
			{
				sceneId: usedSceneId,
				provider: env.OPENAI_API_KEY ? 'gpt-image' : 'pollinations',
				promptLength: prompt.length,
				count: images.length,
			},
			'image-generation.done',
		)
		return Response.json({ images, prompt, sceneId: usedSceneId })
	} catch (error) {
		payload.logger.error({ err: error }, 'image-generation.failed')
		if (error instanceof ImageGenerationUnavailableError) {
			return Response.json({ message: 'Image generation is unavailable.' }, { status: 503 })
		}
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
