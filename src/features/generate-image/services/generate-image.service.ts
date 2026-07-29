import { env } from '@/env'
import {
	DEFAULT_IMAGE_MODEL_PRESET,
	type ImageModelPreset,
} from '@/features/generate-image/image-model'
import {
	type ImageAspectRatio,
	type ImageOutputSize,
	supportsImageOutputSize,
	toOpenAIImageSize,
} from '@/features/generate-image/image-size'
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

interface GeneratedImages {
	images: string[]
	prompt: string
	profileId?: number
	profileName?: string
	model: string
	provider: 'google' | 'openai' | 'pollinations'
}

/**
 * 유스케이스 경계: 사용자 입력과 선택한 published 프로파일로 이미지를 생성한다.
 * Payload 프로파일 조회·모델 호출 I/O는 각 repository가 소유하고 상위 route·agent tool은 인증·검증만 담당한다.
 * 자유 생성은 OpenAI를 유지하고 프로파일 생성은 저장된 모델 프리셋을 사용한다.
 */
export async function generateImages({
	userInput,
	profileId,
	user,
	count,
}: {
	userInput: string
	profileId?: number
	user?: unknown
	count: number
}): Promise<GeneratedImages> {
	let prompt = userInput.trim()
	let modelPreset: ImageModelPreset = DEFAULT_IMAGE_MODEL_PRESET
	let aspectRatio: ImageAspectRatio = '1:1'
	let imageSize: ImageOutputSize = '1K'
	let profileName: string | undefined

	if (profileId) {
		const profile = await findPublishedImageProfile(user, profileId)
		if (!profile) throw new ImageProfileNotFoundError()
		const normalized = await normalizeImageProfilePrompt({
			profilePrompt: profile.profilePrompt,
			userPromptNormalization: profile.userPromptNormalization ?? [],
			userPrompt: userInput,
		})
		prompt = JSON.stringify(normalized.finalPrompt)
		modelPreset = profile.imageModelPreset
		aspectRatio = profile.aspectRatio
		imageSize = profile.imageSize
		profileName = profile.name
	}

	return runImageGeneration({
		prompt,
		count,
		modelPreset,
		aspectRatio,
		imageSize,
		...(profileId ? { profileId, profileName } : {}),
	})
}

/**
 * 관리자 유스케이스 경계: 저장 전 폼처럼 명시된 모델과 출력 설정으로 이미지를 생성한다.
 * 외부 모델 I/O는 image-generation repository가 담당한다.
 */
export async function generateImagesWithSettings({
	userInput,
	count,
	imageModelPreset,
	aspectRatio,
	imageSize,
}: {
	userInput: string
	count: number
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
}): Promise<GeneratedImages> {
	return runImageGeneration({
		prompt: userInput.trim(),
		count,
		modelPreset: imageModelPreset,
		aspectRatio,
		imageSize,
	})
}

/** 해석이 끝난 모델·출력 계약을 실제 공급자 호출로 연결한다. */
async function runImageGeneration({
	prompt,
	count,
	modelPreset,
	aspectRatio,
	imageSize,
	profileId,
	profileName,
}: {
	prompt: string
	count: number
	modelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	profileId?: number
	profileName?: string
}): Promise<GeneratedImages> {
	if (!supportsImageOutputSize(modelPreset, imageSize)) {
		throw new Error(`${modelPreset} does not support ${imageSize} output.`)
	}
	let generation: {
		images: string[]
		model: string
		provider: 'google' | 'openai' | 'pollinations'
	}
	if (modelPreset === 'google-nano-banana-2-lite') {
		if (!env.GEMINI_API_KEY) throw new ImageGenerationUnavailableError()
		generation = await generateBrandImages({
			prompt,
			count,
			modelPreset,
			aspectRatio,
			imageSize,
		})
	} else if (modelPreset === 'openai-gpt-image-2' && env.OPENAI_API_KEY) {
		generation = await generateBrandImages({
			prompt,
			count,
			modelPreset,
			aspectRatio,
			imageSize,
		})
	} else if (
		modelPreset === 'openai-gpt-image-2' &&
		env.NODE_ENV === 'development' &&
		env.IMAGE_DEV_FALLBACK === 'true'
	) {
		generation = {
			images: await devGenerateImages(
				prompt,
				toOpenAIImageSize(aspectRatio, imageSize),
				count,
			),
			model: 'flux',
			provider: 'pollinations',
		}
	} else {
		throw new ImageGenerationUnavailableError()
	}
	return {
		...generation,
		prompt,
		...(profileId ? { profileId, profileName } : {}),
	}
}
