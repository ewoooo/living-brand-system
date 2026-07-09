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
		sceneId,
	} = (await request.json().catch(() => ({}))) as {
		prompt?: string
		count?: number
		sceneId?: string
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
		const {
			images,
			prompt,
			sceneId: usedSceneId,
		} = await generateImageCandidates({
			userInput,
			sceneId,
			count: n,
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
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
