import { z } from 'zod'
import { IMAGE_MODEL_PRESETS } from '@/features/generate-image/image-model'
import {
	IMAGE_ASPECT_RATIOS,
	IMAGE_OUTPUT_SIZES,
	supportsImageOutputSize,
} from '@/features/generate-image/image-size'
import {
	generateImages,
	generateImagesWithSettings,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
} from '@/features/generate-image/services/generate-image.service'
import { isManager } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const baseFields = {
	prompt: z.string().trim().min(1).max(2_500),
	count: z.number().int().min(1).max(6).default(1),
}

const requestSchema = z.union([
	z
		.object({
			...baseFields,
			aspectRatio: z.enum(IMAGE_ASPECT_RATIOS),
			imageModelPreset: z.enum(IMAGE_MODEL_PRESETS),
			imageSize: z.enum(IMAGE_OUTPUT_SIZES),
		})
		.strict()
		.refine((input) => supportsImageOutputSize(input.imageModelPreset, input.imageSize)),
	z
		.object({
			...baseFields,
			profileId: z.number().int().positive(),
		})
		.strict(),
])

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}
	if (!isManager(user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	const parsed = requestSchema.safeParse(await request.json().catch(() => null))
	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const { prompt: userInput, count } = parsed.data

	try {
		const result =
			'imageModelPreset' in parsed.data
				? await generateImagesWithSettings({
						userInput,
						count,
						aspectRatio: parsed.data.aspectRatio,
						imageModelPreset: parsed.data.imageModelPreset,
						imageSize: parsed.data.imageSize,
					})
				: await generateImages({
						userInput,
						count,
						profileId: parsed.data.profileId,
						user,
					})
		if (result.images.length === 0) {
			return Response.json({ message: 'Image generation failed.' }, { status: 502 })
		}
		const { provider, ...response } = result
		payload.logger.info(
			{
				provider,
				model: result.model,
				promptLength: result.prompt.length,
				count: result.images.length,
			},
			'admin-image-generation.done',
		)
		return Response.json(response)
	} catch (error) {
		payload.logger.error({ err: error }, 'admin-image-generation.failed')
		if (error instanceof ImageGenerationUnavailableError) {
			return Response.json({ message: 'Image generation is unavailable.' }, { status: 503 })
		}
		if (error instanceof ImageProfileNotFoundError) {
			return Response.json({ message: 'Image profile not found.' }, { status: 404 })
		}
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
