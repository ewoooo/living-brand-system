import { z } from 'zod'
import { cameraControlSchema } from '@/features/image-generation/camera-control'
import {
	IMAGE_BATCH_DEFAULT,
	IMAGE_BATCH_MAX,
	IMAGE_PROMPT_MAX_LENGTH,
} from '@/features/image-generation/image-generation-limits'
import { IMAGE_ASPECT_RATIOS, IMAGE_OUTPUT_SIZES } from '@/features/image-generation/image-size'
import { respondImageGeneration } from '@/features/image-generation/respond-image-generation'
import { generateImages } from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const requestSchema = z
	.object({
		// 참조가 있으면 그 프롬프트를 물려받으므로 프롬프트는 선택이다.
		prompt: z.string().trim().max(IMAGE_PROMPT_MAX_LENGTH).default(''),
		count: z.number().int().min(1).max(IMAGE_BATCH_MAX).default(IMAGE_BATCH_DEFAULT),
		profileId: z.number().int().positive(),
		// 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율로 생성한다.
		aspectRatio: z.enum(IMAGE_ASPECT_RATIOS).optional(),
		// 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도로 생성한다.
		imageSize: z.enum(IMAGE_OUTPUT_SIZES).optional(),
		// 참조 이미지 — 지금은 내 생성 결과만 소스다.
		reference: z.strictObject({ generatedImageId: z.number().int().positive() }).optional(),
		camera: cameraControlSchema.optional(),
	})
	.strict()
	.refine(
		(value) => value.prompt.length > 0 || value.reference !== undefined,
		'prompt or reference is required.',
	)

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

	const {
		prompt: userInput,
		count,
		profileId,
		aspectRatio,
		imageSize,
		camera,
		reference,
	} = parsed.data

	return respondImageGeneration({
		run: () =>
			generateImages({
				userInput,
				profileId,
				user,
				count,
				aspectRatio,
				imageSize,
				...(camera ? { camera } : {}),
				...(reference ? { reference: { ...reference, requestUrl: request.url } } : {}),
			}),
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
