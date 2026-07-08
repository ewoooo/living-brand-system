import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'

/**
 * 유스케이스 경계: 프롬프트를 받아 이미지 후보 N장을 생성해 data URI로 돌려준다.
 * 외부 I/O(OpenAI 이미지 모델 호출)는 이 함수가 소유하고, 상위(route)는 인증·검증만
 * 담당한다 (docs/06 §6). API 키는 OPENAI_API_KEY 환경변수에서 provider가 자동으로 읽는다.
 */
export async function generateBrandImages({
	prompt,
	count,
}: {
	prompt: string
	count: number
}): Promise<string[]> {
	const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2'
	const { images } = await generateImage({
		model: openai.image(model),
		prompt,
		n: count,
		size: '1024x1024',
	})
	return images.map((image) => `data:${image.mediaType};base64,${image.base64}`)
}
