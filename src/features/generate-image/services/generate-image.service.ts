import { env } from '@/env'
import type { ImageSize } from '@/features/generate-image/image-size'
import { devGenerateImages } from '@/features/generate-image/repositories/dev-image-generation.rest.repository'
import { generateBrandImages } from '@/features/generate-image/repositories/image-generation.ai.repository'
import { findPublishedImageProfile } from '@/features/generate-image/repositories/image-profile.payload.repository'
import {
	ImagePromptNormalizationUnavailableError,
	normalizeImageProfilePrompt,
} from '@/features/generate-image/services/normalize-image-profile-prompt.service'

export { ImagePromptNormalizationUnavailableError }

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	/** 실제로 이미지 모델에 들어간 합성 프롬프트 (디버깅·재현용). */
	prompt: string
	profileId?: number
	profileName?: string
	images: string[]
}

/** Provider 미설정을 route/agent 표면이 일반 생성 실패와 구분하기 위한 서비스 오류. */
export class ImageGenerationUnavailableError extends Error {
	constructor() {
		super('Image generation provider is not configured.')
		this.name = 'ImageGenerationUnavailableError'
	}
}

export class ImageProfileNotFoundError extends Error {
	constructor() {
		super('Published image profile was not found.')
		this.name = 'ImageProfileNotFoundError'
	}
}

/**
 * 유스케이스 경계: 사용자 입력과 선택한 published 프로파일로 이미지 후보를 생성한다.
 * Payload 프로파일 조회·모델 호출 I/O는 각 repository가 소유하고 상위 route·agent tool은 인증·검증만 담당한다.
 * 정식 엔진은 gpt-image-2(OPENAI_API_KEY). 개발 환경에서 명시적으로 허용한 경우에만
 * Pollinations 폴백을 쓰고, 나머지 환경은 provider 미설정 상태로 닫는다.
 */
export async function generateImageCandidates({
	userInput,
	profileId,
	user,
	count,
}: {
	userInput: string
	profileId?: number
	user?: unknown
	count: number
}): Promise<{
	images: string[]
	prompt: string
	profileId?: number
	profileName?: string
}> {
	let prompt = userInput.trim()
	let size: ImageSize = '1024x1024'
	let profileName: string | undefined

	if (profileId) {
		const profile = await findPublishedImageProfile(user, profileId)
		if (!profile) throw new ImageProfileNotFoundError()
		const normalized = await normalizeImageProfilePrompt({
			profilePrompt: profile.profilePrompt,
			userPromptNormalization: profile.userPromptNormalization,
			userPrompt: userInput,
		})
		prompt = JSON.stringify(normalized.finalPrompt)
		// ponytail: 현재 프로파일은 모두 세로 제품컷이다. 다른 비율이 생길 때 프로파일 필드로 올린다.
		size = '1024x1536'
		profileName = profile.name
	}
	let images: string[]
	if (env.OPENAI_API_KEY) {
		images = await generateBrandImages({ prompt, count, size })
	} else if (env.NODE_ENV === 'development' && env.IMAGE_DEV_FALLBACK === 'true') {
		images = await devGenerateImages(prompt, size, count)
	} else {
		throw new ImageGenerationUnavailableError()
	}
	return {
		images,
		prompt,
		...(profileId ? { profileId, profileName } : {}),
	}
}
