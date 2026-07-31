import sharp from 'sharp'
import { env } from '@/env'
import {
	type CameraControlInput,
	composeCameraAdjustmentPrompt,
	type ResolvedCameraControl,
	resolveCameraControl,
} from '@/features/generate-image/camera-control'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
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

/** 카메라 조정 경계가 외부 모델 호출 전에 손상되거나 위장된 시드 이미지를 거부할 때 사용한다. */
export class InvalidSeedImageError extends Error {
	constructor() {
		super('Seed image data is invalid.')
		this.name = 'InvalidSeedImageError'
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

interface CameraAdjustedImages extends GeneratedImages {
	camera: {
		input: CameraControlInput
		resolved: ResolvedCameraControl
	}
}

/**
 * 유스케이스 경계: 사용자 입력과 선택한 published 프로파일로 이미지를 생성한다.
 * Payload 프로파일 조회·모델 호출 I/O는 각 repository가 소유하고 상위 route·agent tool은 인증·검증만 담당한다.
 */
export async function generateImages({
	userInput,
	profileId,
	user,
	count,
}: {
	userInput: string
	profileId: number
	user: unknown
	count: number
}): Promise<GeneratedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const normalized = await normalizeImageProfilePrompt({
		profilePrompt: profile.profilePrompt,
		userPromptNormalization: profile.userPromptNormalization ?? [],
		userPrompt: userInput,
	})

	return runImageGeneration({
		prompt: JSON.stringify(normalized.finalPrompt),
		count,
		modelPreset: profile.imageModelPreset,
		aspectRatio: profile.aspectRatio,
		imageSize: profile.imageSize,
		profileId,
		profileName: profile.name,
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

/**
 * 유스케이스 경계: published 프로파일의 모델·출력 계약으로 시드 이미지의 카메라 시점을 조정한다.
 * 프로파일 조회와 외부 이미지 편집 I/O는 각 repository가 소유한다.
 */
export async function adjustImageCamera({
	basePrompt,
	camera,
	count,
	profileId,
	seedImage,
	user,
}: {
	basePrompt: string
	camera: CameraControlInput
	count: number
	profileId: number
	seedImage: string
	user: unknown
}): Promise<CameraAdjustedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()

	const resolved = resolveCameraControl(camera)
	const prompt = composeCameraAdjustmentPrompt(basePrompt, resolved)
	const result = await runImageGeneration({
		prompt,
		count,
		modelPreset: profile.imageModelPreset,
		aspectRatio: profile.aspectRatio,
		imageSize: profile.imageSize,
		profileId,
		profileName: profile.name,
		seedImage: await decodeSeedImage(seedImage),
	})

	return {
		...result,
		camera: { input: camera, resolved },
	}
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
	seedImage,
}: {
	prompt: string
	count: number
	modelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	profileId?: number
	profileName?: string
	seedImage?: Uint8Array
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
			...(seedImage ? { seedImage } : {}),
		})
	} else if (modelPreset === 'openai-gpt-image-2' && env.OPENAI_API_KEY) {
		generation = await generateBrandImages({
			prompt,
			count,
			modelPreset,
			aspectRatio,
			imageSize,
			...(seedImage ? { seedImage } : {}),
		})
	} else if (
		!seedImage &&
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

async function decodeSeedImage(dataUri: string): Promise<Uint8Array> {
	const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUri)
	if (!match) throw new InvalidSeedImageError()

	const bytes = Buffer.from(match[2], 'base64')
	const mediaType = match[1]
	const valid =
		(mediaType === 'png' &&
			startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
		(mediaType === 'jpeg' && startsWith(bytes, [0xff, 0xd8, 0xff])) ||
		(mediaType === 'webp' &&
			startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
			startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50]))

	if (!valid) throw new InvalidSeedImageError()

	try {
		const metadata = await sharp(bytes, { limitInputPixels: 16_777_216 }).metadata()
		if (metadata.format !== mediaType) throw new InvalidSeedImageError()
		return bytes
	} catch {
		throw new InvalidSeedImageError()
	}
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
	return signature.every((byte, index) => bytes[index] === byte)
}
