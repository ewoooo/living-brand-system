import { env } from '@/env'
import {
	type CameraControlInput,
	composeCameraAdjustmentPrompt,
	type ResolvedCameraControl,
	resolveCameraControl,
} from '@/features/generate-image/camera-control'
import {
	acquireImageGenerationSlot,
	ImageGenerationLimitError,
} from '@/features/generate-image/image-generation-gate'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import {
	type ImageAspectRatio,
	type ImageOutputSize,
	supportsImageOutputSize,
	toOpenAIImageSize,
} from '@/features/generate-image/image-size'
import { devGenerateImages } from '@/features/generate-image/repositories/dev-image-generation.rest.repository'
import {
	loadGeneratedImage,
	storeGeneratedImages,
} from '@/features/generate-image/repositories/generated-image.payload.repository'
import {
	generateBrandImages,
	getImageModelApiKey,
	type ImageGenerationProvider,
} from '@/features/generate-image/repositories/image-generation.ai.repository'
import { findPublishedImageProfile } from '@/features/generate-image/repositories/image-profile.payload.repository'
import type { ImageGenerationResult } from '@/features/generate-image/services/generate-image.client'
import {
	ImageGenerationUnavailableError,
	normalizeImageProfilePrompt,
} from '@/features/generate-image/services/normalize-image-profile-prompt.service'

export { ImageGenerationLimitError, ImageGenerationUnavailableError }

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	/** 실제로 이미지 모델에 들어간 합성 프롬프트 (디버깅·재현용). */
	prompt: string
	profileId?: number
	profileName?: string
	images: string[]
}

export class ImageProfileNotFoundError extends Error {
	constructor() {
		super('Published image profile was not found.')
		this.name = 'ImageProfileNotFoundError'
	}
}

/** 카메라 조정 경계가 조회할 수 없는 생성 이미지 참조를 거부할 때 사용한다. */
export class InvalidSeedImageError extends Error {
	constructor() {
		super('Seed image data is invalid.')
		this.name = 'InvalidSeedImageError'
	}
}

/** 프리셋이 지원하지 않는 출력 해상도가 서비스까지 도달했을 때 표면이 검증 오류로 구분할 수 있게 한다. */
export class UnsupportedImageOutputSizeError extends Error {
	constructor(modelPreset: ImageModelPreset, imageSize: ImageOutputSize) {
		super(`${modelPreset} does not support ${imageSize} output.`)
		this.name = 'UnsupportedImageOutputSizeError'
	}
}

/** 라우트 응답 계약(ImageGenerationResult)에 서버 내부 provider 태그만 더한 서비스 결과. */
interface GeneratedImages extends ImageGenerationResult {
	provider: ImageGenerationProvider
}

interface CameraAdjustedImages extends GeneratedImages {
	camera: {
		input: CameraControlInput
		resolved: ResolvedCameraControl
	}
}

/** ImageGenerationPlan IR — 프로파일 경로와 설정 경로가 모두 이 해석 완료 입력으로 수렴하고, 러너는 이것만 소비한다. */
export interface ImageGenerationPlan {
	prompt: string
	count: number
	modelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	profileId?: number
	profileName?: string
	seedImage?: Uint8Array
}

/** published 프로파일의 모델·출력 계약을 생성 플랜으로 해석한다. 비율·해상도 오버라이드는 여기서만 판단한다. 순수 함수. */
export function planImageGenerationFromProfile(
	profile: {
		aspectRatio: ImageAspectRatio
		id: number
		imageModelPreset: ImageModelPreset
		imageSize: ImageOutputSize
		name: string
	},
	input: {
		prompt: string
		count: number
		seedImage?: Uint8Array
		/** 템플릿 이미지 슬롯 박스에서 유도한 비율 — 있으면 프로파일 비율 대신 쓴다(크롭 손실 최소화). */
		aspectRatio?: ImageAspectRatio
		/** 스튜디오에서 고른 해상도 — 있으면 프로파일 해상도 대신 쓴다(모델 제약은 러너가 검증한다). */
		imageSize?: ImageOutputSize
	},
): ImageGenerationPlan {
	return {
		prompt: input.prompt,
		count: input.count,
		modelPreset: profile.imageModelPreset,
		aspectRatio: input.aspectRatio ?? profile.aspectRatio,
		imageSize: input.imageSize ?? profile.imageSize,
		profileId: profile.id,
		profileName: profile.name,
		...(input.seedImage ? { seedImage: input.seedImage } : {}),
	}
}

/** 저장 전 폼처럼 명시된 모델·출력 설정을 생성 플랜으로 해석한다. 순수 함수. */
export function planImageGenerationFromSettings(input: {
	userInput: string
	count: number
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
}): ImageGenerationPlan {
	return {
		prompt: input.userInput.trim(),
		count: input.count,
		modelPreset: input.imageModelPreset,
		aspectRatio: input.aspectRatio,
		imageSize: input.imageSize,
	}
}

/**
 * 유스케이스 경계: 사용자 입력과 선택한 published 프로파일로 이미지를 생성한다.
 * 프로파일 조회·모델 호출·생성 파일 저장 I/O는 각 repository가 소유한다.
 */
export async function generateImages({
	userInput,
	profileId,
	user,
	count,
	aspectRatio,
	imageSize,
}: {
	userInput: string
	profileId: number
	user: unknown
	count: number
	/** 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율. */
	aspectRatio?: ImageAspectRatio
	/** 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도. */
	imageSize?: ImageOutputSize
}): Promise<GeneratedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const normalized = await normalizeImageProfilePrompt({
		profilePrompt: profile.profilePrompt,
		userPromptNormalization: profile.userPromptNormalization ?? [],
		userPrompt: userInput,
	})

	const plan = planImageGenerationFromProfile(profile, {
		prompt: JSON.stringify(normalized.finalPrompt),
		count,
		aspectRatio,
		imageSize,
	})
	const generated = await runImageGeneration(plan, user)
	return storeProfileGeneration(generated, {
		inputPrompt: userInput,
		// 저장 메타데이터의 비율·해상도는 실제 생성에 쓴 plan이 정본 — 오버라이드 시 프로파일 값과 다르다.
		profile: { ...profile, aspectRatio: plan.aspectRatio, imageSize: plan.imageSize },
		user,
	})
}

/**
 * 관리자 유스케이스 경계: 저장 전 폼처럼 명시된 모델과 출력 설정으로 이미지를 생성한다.
 * 외부 모델 I/O는 image-generation repository가 담당한다.
 */
export async function generateImagesWithSettings({
	user,
	...input
}: {
	userInput: string
	count: number
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	user: unknown
}): Promise<GeneratedImages> {
	return runImageGeneration(planImageGenerationFromSettings(input), user)
}

/**
 * 유스케이스 경계: published 프로파일의 모델·출력 계약으로 시드 이미지의 카메라 시점을 조정한다.
 * 프로파일 조회·외부 이미지 편집·생성 파일 저장 I/O는 각 repository가 소유한다.
 */
export async function adjustImageCamera({
	basePrompt,
	camera,
	count,
	generatedImageId,
	profileId,
	requestUrl,
	user,
}: {
	basePrompt: string
	camera: CameraControlInput
	count: number
	generatedImageId: number
	profileId: number
	requestUrl: string
	user: unknown
}): Promise<CameraAdjustedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const seedImage = await loadGeneratedImage({
		generatedImageId,
		profileId,
		requestUrl,
		user,
	})
	if (!seedImage) throw new InvalidSeedImageError()

	const resolved = resolveCameraControl(camera)
	const result = await runImageGeneration(
		planImageGenerationFromProfile(profile, {
			prompt: composeCameraAdjustmentPrompt(basePrompt, resolved),
			count,
			seedImage,
		}),
		user,
	)
	const stored = await storeProfileGeneration(result, {
		inputPrompt: basePrompt,
		profile,
		user,
	})

	return {
		...stored,
		camera: { input: camera, resolved },
	}
}

/**
 * 해석이 끝난 생성 플랜을 실제 공급자 호출로 연결한다. 키가 없으면 dev 폴백 또는 불가로 종료한다.
 * 모델 호출 직전에만 공용 생성 게이트를 통과시킨다 — 호출 전에 거부된 요청은 사용자 한도를 소모하지 않는다.
 */
async function runImageGeneration(
	plan: ImageGenerationPlan,
	user: unknown,
): Promise<GeneratedImages> {
	const {
		prompt,
		count,
		modelPreset,
		aspectRatio,
		imageSize,
		profileId,
		profileName,
		seedImage,
	} = plan
	if (!supportsImageOutputSize(modelPreset, imageSize)) {
		throw new UnsupportedImageOutputSizeError(modelPreset, imageSize)
	}
	const useDevFallback = !getImageModelApiKey(modelPreset)
	if (useDevFallback) assertDevFallbackAllowed(plan)

	const release = acquireImageGenerationSlot(getAuthenticatedUserId(user))
	try {
		const generation = useDevFallback
			? await generateDevFallbackImages(plan)
			: await generateBrandImages({
					prompt,
					count,
					modelPreset,
					aspectRatio,
					imageSize,
					...(seedImage ? { seedImage } : {}),
				})
		return {
			...generation,
			aspectRatio,
			imageSize,
			prompt,
			...(profileId ? { profileId, profileName } : {}),
		}
	} finally {
		release()
	}
}

// ⚠️ 임시 — API 키가 없을 때의 마지막 결정. development + IMAGE_DEV_FALLBACK=true의
// 텍스트 생성(openai 프리셋, 시드 없음)만 Pollinations로 보내고, 그 외에는 불가로 닫는다.
function assertDevFallbackAllowed({ modelPreset, seedImage }: ImageGenerationPlan) {
	const devFallbackAllowed =
		!seedImage &&
		modelPreset === 'openai-gpt-image-2' &&
		env.NODE_ENV === 'development' &&
		env.IMAGE_DEV_FALLBACK === 'true'
	if (!devFallbackAllowed) throw new ImageGenerationUnavailableError()
}

async function generateDevFallbackImages({
	prompt,
	count,
	aspectRatio,
	imageSize,
}: ImageGenerationPlan): Promise<{
	images: string[]
	model: string
	provider: ImageGenerationProvider
}> {
	return {
		images: await devGenerateImages(prompt, toOpenAIImageSize(aspectRatio, imageSize), count),
		model: 'flux',
		provider: 'pollinations',
	}
}

async function storeProfileGeneration(
	generated: GeneratedImages,
	{
		inputPrompt,
		profile,
		user,
	}: {
		inputPrompt: string
		profile: {
			aspectRatio: ImageAspectRatio
			id: number
			imageSize: ImageOutputSize
			name: string
		}
		user: unknown
	},
): Promise<GeneratedImages> {
	const createdBy = getAuthenticatedUserId(user)
	const generatedImages = await storeGeneratedImages({
		createdBy,
		effectivePrompt: generated.prompt,
		images: generated.images,
		inputPrompt,
		model: generated.model,
		profile,
	})
	return {
		...generated,
		generatedImages,
		images: generatedImages.map(({ url }) => url),
	}
}

function getAuthenticatedUserId(user: unknown): number {
	const id = typeof user === 'object' && user !== null && 'id' in user ? user.id : undefined
	if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
		throw new Error('Authenticated user ID is required.')
	}
	return id
}
