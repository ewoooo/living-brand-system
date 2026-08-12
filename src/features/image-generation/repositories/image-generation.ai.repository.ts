import { createGoogle } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import {
	GOOGLE_NANO_BANANA_2_LITE_MODEL,
	type ImageModelPreset,
	OPENAI_GPT_IMAGE_2_MODEL,
} from '@/features/image-generation/image-model'
import {
	type ImageAspectRatio,
	type ImageOutputSize,
	toOpenAIImageSize,
} from '@/features/image-generation/image-size'

/** 프리셋별 실제 모델 호출 입력 — 시드 이미지는 편집 프롬프트 형태로 이미 합성돼 있다. */
interface ImageProviderCallInput {
	prompt: string | { text: string; images: Uint8Array[] }
	count: number
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
}

interface ImageModelProviderEntry {
	apiKey: () => string | undefined
	generate: (input: ImageProviderCallInput) => Promise<string[]>
	model: string
	provider: 'google' | 'openai'
}

/** 프리셋 → {환경 API 키, 모델 id, provider 태그, 실제 호출} 단일 표 — 프리셋 분기는 여기서만 일어난다. */
const imageModelProviders = {
	'google-nano-banana-2-lite': {
		apiKey: () => env.GEMINI_API_KEY,
		model: GOOGLE_NANO_BANANA_2_LITE_MODEL,
		provider: 'google',
		generate: ({ prompt, count, aspectRatio, imageSize }) => {
			const google = createGoogle({ apiKey: env.GEMINI_API_KEY })
			return Promise.all(
				Array.from({ length: count }, async () => {
					const { image } = await generateImage({
						model: google.image(GOOGLE_NANO_BANANA_2_LITE_MODEL),
						prompt,
						providerOptions: {
							google: {
								imageConfig: { aspectRatio, imageSize },
							},
						},
					})
					return `data:${image.mediaType};base64,${image.base64}`
				}),
			)
		},
	},
	'openai-gpt-image-2': {
		apiKey: () => env.OPENAI_API_KEY,
		model: OPENAI_GPT_IMAGE_2_MODEL,
		provider: 'openai',
		generate: async ({ prompt, count, aspectRatio, imageSize }) => {
			const { images } = await generateImage({
				model: openai.image(OPENAI_GPT_IMAGE_2_MODEL),
				prompt,
				n: count,
				size: toOpenAIImageSize(aspectRatio, imageSize),
			})
			return images.map((image) => `data:${image.mediaType};base64,${image.base64}`)
		},
	},
} satisfies Record<ImageModelPreset, ImageModelProviderEntry>

type ImageModelProvider = (typeof imageModelProviders)[ImageModelPreset]['provider']

/** 프리셋 표에서 파생된 provider 태그 union — dev 폴백(pollinations)까지 포함한 유일한 선언. */
export type ImageGenerationProvider = ImageModelProvider | 'pollinations'

/** 프리셋이 요구하는 환경 API 키를 조회한다 — 서비스의 가용성 판단(dev 폴백/불가)에 쓰인다. */
export function getImageModelApiKey(modelPreset: ImageModelPreset): string | undefined {
	return imageModelProviders[modelPreset].apiKey()
}

/** 선택된 외부 이미지 모델 호출과 data URI 변환을 소유한다. */
export async function generateBrandImages({
	prompt,
	count,
	modelPreset,
	aspectRatio,
	imageSize,
	seedImage,
}: {
	prompt: string
	count: number
	modelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	seedImage?: Uint8Array
}): Promise<{
	images: string[]
	model: string
	provider: ImageModelProvider
}> {
	const entry = imageModelProviders[modelPreset]
	const imagePrompt = seedImage ? { text: prompt, images: [seedImage] } : prompt

	return {
		images: await entry.generate({ prompt: imagePrompt, count, aspectRatio, imageSize }),
		model: entry.model,
		provider: entry.provider,
	}
}
