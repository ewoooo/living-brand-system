import { env } from '@/env'
import { generateImageCandidates } from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const {
		prompt: userInput,
		count,
		presetId,
	} = (await request.json().catch(() => ({}))) as {
		prompt?: string
		count?: number
		presetId?: string
	}
	if (!userInput?.trim()) {
		return Response.json({ message: 'prompt required' }, { status: 400 })
	}
	const n = Math.min(Math.max(count ?? 4, 1), 6)

	const { payload, user } = await authenticateRequest()
	// 유료(gpt-image) 경로만 인증 게이트. 키 없는 dev 폴백은 로컬 검증용이라 개방 (docs/07).
	if (env.OPENAI_API_KEY && !user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const images = await generateImageCandidates({ userInput, presetId, count: n })
		if (images.length === 0) {
			return Response.json({ message: 'Image generation failed.' }, { status: 502 })
		}
		return Response.json({ images })
	} catch (error) {
		payload.logger.error({ err: error }, 'image-generation.failed')
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
