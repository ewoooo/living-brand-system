import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import { composeImageRequest, type ImageSize } from '@/features/image-generation/presets'
import { devGenerateImages } from '@/features/image-generation/services/dev-fallback.provider'

const DEFAULT_MODEL = 'gpt-image-2'

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	/** 실제로 이미지 모델에 들어간 합성 프롬프트 (디버깅·재현용). */
	prompt: string
	/** 실제 적용된 Scene id ('free'|scene id). */
	sceneId?: string
	images: string[]
}

/**
 * 유스케이스 경계: 사용자 입력(+Scene)을 받아 이미지 후보 N장을 생성해 data URI로 돌려준다.
 * 합성 프롬프트·적용 Scene도 함께 반환해 상위 표면이 결과 품질을 디버깅·재현할 수 있게 한다(R&D 방식).
 * 프롬프트 합성은 결정론(presets.composeImageRequest)이 하고, 프로바이더 호출 I/O는 이 모듈이 소유하며,
 * 상위(route·agent tool)는 인증·검증만 담당한다 (docs/06 §6).
 * 정식 엔진은 gpt-image-2(OPENAI_API_KEY). 키 수령 전까지만 dev 폴백으로 임시 대체한다.
 */
export async function generateImageCandidates({
	userInput,
	sceneId,
	count,
}: {
	userInput: string
	sceneId?: string
	count: number
}): Promise<{ images: string[]; prompt: string; sceneId: string }> {
	const { prompt, size, sceneId: resolvedSceneId } = composeImageRequest(userInput, sceneId)
	const images = env.OPENAI_API_KEY
		? await generateBrandImages({ prompt, count, size })
		: await devGenerateImages(prompt, size, count) // ⚠️ 임시 폴백 — 키 오면 이 분기 삭제
	return { images, prompt, sceneId: resolvedSceneId }
}

async function generateBrandImages({
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
