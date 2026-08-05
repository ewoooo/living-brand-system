import { z } from 'zod'
import { respondImageGeneration } from '@/features/generate-image/respond-image-generation'
import { generateImages } from '@/features/generate-image/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const requestSchema = z
	.object({
		prompt: z.string().trim().min(1).max(500),
		count: z.number().int().min(1).max(6).default(4),
		profileId: z.number().int().positive(),
	})
	.strict()

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

	return respondImageGeneration({
		run: () => generateImages({ userInput, profileId, user, count }),
		logger: payload.logger,
		event: 'image-generation',
		doneLog: (result) => ({
			profileId: result.profileId,
			provider: result.provider,
			model: result.model,
			promptLength: result.prompt.length,
			count: result.images.length,
		}),
	})
}
