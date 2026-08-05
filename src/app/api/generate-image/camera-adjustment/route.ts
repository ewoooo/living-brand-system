import {
	cameraAdjustmentRequestSchema,
	MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES,
} from '@/features/generate-image/camera-control'
import { respondImageGeneration } from '@/features/generate-image/respond-image-generation'
import { adjustImageCamera } from '@/features/generate-image/services/generate-image.service'
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

	return respondImageGeneration({
		run: () => adjustImageCamera({ ...parsed.data, requestUrl: request.url, user }),
		logger: payload.logger,
		event: 'image-camera-adjustment',
		doneLog: (result) => ({
			camera: result.camera.resolved,
			count: result.images.length,
			model: result.model,
			profileId: result.profileId,
			promptLength: result.prompt.length,
			provider: result.provider,
		}),
		failedLog: (error) => ({
			errorName: error instanceof Error ? error.name : 'UnknownError',
		}),
	})
}
