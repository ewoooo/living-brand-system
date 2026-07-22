import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import type { ImageSize } from '@/features/image-generation/image-size'

const DEFAULT_MODEL = 'gpt-image-2'

/** OpenAI 이미지 모델 호출과 data URI 변환을 소유한다. */
export async function generateBrandImages({
	prompt,
	count,
	size,
}: {
	prompt: string
	count: number
	size: ImageSize
}): Promise<string[]> {
	const { images } = await generateImage({
		model: openai.image(env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL),
		prompt,
		n: count,
		size,
	})

	return images.map((image) => `data:${image.mediaType};base64,${image.base64}`)
}
