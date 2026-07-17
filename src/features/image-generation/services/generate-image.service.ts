import { env } from '@/env'
import { composeImageRequest } from '@/features/image-generation/presets'
import { devGenerateImages } from '@/features/image-generation/repositories/dev-image-generation.rest.repository'
import { generateBrandImages } from '@/features/image-generation/repositories/image-generation.ai.repository'

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	/** 실제로 이미지 모델에 들어간 합성 프롬프트 (디버깅·재현용). */
	prompt: string
	/** 실제 적용된 Scene id ('free'|scene id). */
	sceneId?: string
	images: string[]
}

/** Provider 미설정을 route/agent 표면이 일반 생성 실패와 구분하기 위한 서비스 오류. */
export class ImageGenerationUnavailableError extends Error {
	constructor() {
		super('Image generation provider is not configured.')
		this.name = 'ImageGenerationUnavailableError'
	}
}

/**
 * 유스케이스 경계: 사용자 입력(+Scene)을 받아 이미지 후보 N장을 생성해 data URI로 돌려준다.
 * 합성 프롬프트·적용 Scene도 함께 반환해 상위 표면이 결과 품질을 디버깅·재현할 수 있게 한다(R&D 방식).
 * 프롬프트 합성은 결정론(presets.composeImageRequest)이 하고, 프로바이더 호출 I/O는 repository가 소유하며,
 * 상위(route·agent tool)는 인증·검증만 담당한다 (docs/06 §6).
 * 정식 엔진은 gpt-image-2(OPENAI_API_KEY). 개발 환경에서 명시적으로 허용한 경우에만
 * Pollinations 폴백을 쓰고, 나머지 환경은 provider 미설정 상태로 닫는다.
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
	let images: string[]
	if (env.OPENAI_API_KEY) {
		images = await generateBrandImages({ prompt, count, size })
	} else if (env.NODE_ENV === 'development' && env.IMAGE_DEV_FALLBACK === 'true') {
		images = await devGenerateImages(prompt, size, count)
	} else {
		throw new ImageGenerationUnavailableError()
	}
	return { images, prompt, sceneId: resolvedSceneId }
}
