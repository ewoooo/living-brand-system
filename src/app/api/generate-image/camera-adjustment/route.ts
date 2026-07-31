import {
	cameraAdjustmentRequestSchema,
	MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES,
} from '@/features/generate-image/camera-control'
import {
	adjustImageCamera,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	InvalidSeedImageError,
} from '@/features/generate-image/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const contentLength = Number(request.headers.get('content-length') ?? 0)
	if (contentLength > MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES) {
		return Response.json({ message: 'Request too large.' }, { status: 413 })
	}

	const parsed = cameraAdjustmentRequestSchema.safeParse(await request.json().catch(() => null))
	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	try {
		const result = await adjustImageCamera({ ...parsed.data, user })
		if (result.images.length === 0) {
			return Response.json({ message: 'Image generation failed.' }, { status: 502 })
		}

		const { provider, ...response } = result
		payload.logger.info(
			{
				camera: result.camera.resolved,
				count: result.images.length,
				model: result.model,
				profileId: result.profileId,
				promptLength: result.prompt.length,
				provider,
			},
			'image-camera-adjustment.done',
		)
		return Response.json(response)
	} catch (error) {
		payload.logger.error(
			{
				errorName: error instanceof Error ? error.name : 'UnknownError',
			},
			'image-camera-adjustment.failed',
		)
		if (error instanceof ImageGenerationUnavailableError) {
			return Response.json({ message: 'Image generation is unavailable.' }, { status: 503 })
		}
		if (error instanceof ImageProfileNotFoundError) {
			return Response.json({ message: 'Image profile not found.' }, { status: 404 })
		}
		if (error instanceof InvalidSeedImageError) {
			return Response.json({ message: 'Invalid seed image.' }, { status: 400 })
		}
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
