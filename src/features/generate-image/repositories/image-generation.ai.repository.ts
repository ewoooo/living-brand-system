import { createGoogle } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import {
	GOOGLE_NANO_BANANA_2_LITE_MODEL,
	type ImageModelPreset,
	OPENAI_GPT_IMAGE_2_MODEL,
} from '@/features/generate-image/image-model'
import {
	type ImageAspectRatio,
	type ImageOutputSize,
	toOpenAIImageSize,
} from '@/features/generate-image/image-size'

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
	provider: 'google' | 'openai'
}> {
	const imagePrompt = seedImage ? { text: prompt, images: [seedImage] } : prompt

	if (modelPreset === 'google-nano-banana-2-lite') {
		const google = createGoogle({ apiKey: env.GEMINI_API_KEY })
		const images = await Promise.all(
			Array.from({ length: count }, async () => {
				const { image } = await generateImage({
					model: google.image(GOOGLE_NANO_BANANA_2_LITE_MODEL),
					prompt: imagePrompt,
					providerOptions: {
						google: {
							imageConfig: { aspectRatio, imageSize },
						},
					},
				})
				return `data:${image.mediaType};base64,${image.base64}`
			}),
		)

		return {
			images,
			model: GOOGLE_NANO_BANANA_2_LITE_MODEL,
			provider: 'google',
		}
	}

	const { images } = await generateImage({
		model: openai.image(OPENAI_GPT_IMAGE_2_MODEL),
		prompt: imagePrompt,
		n: count,
		size: toOpenAIImageSize(aspectRatio, imageSize),
	})

	return {
		images: images.map((image) => `data:${image.mediaType};base64,${image.base64}`),
		model: OPENAI_GPT_IMAGE_2_MODEL,
		provider: 'openai',
	}
}
