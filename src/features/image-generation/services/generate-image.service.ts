import { env } from '@/env'
import {
	type CameraControlInput,
	composeCameraAdjustmentPrompt,
	imageEffectivePromptSchema,
	type ResolvedCameraControl,
	resolveCameraControl,
} from '@/features/image-generation/camera-control'
import {
	acceptsImagePromptExecution,
	deriveImageStudioConfig,
	getImageStudioControls,
	getImageStudioFeature,
	type ImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import {
	acquireImageGenerationSlot,
	ImageGenerationLimitError,
} from '@/features/image-generation/image-generation-gate'
import type { ImageModelPreset } from '@/features/image-generation/image-model'
import {
	type ImageAspectRatio,
	type ImageOutputSize,
	supportsImageOutputSize,
	toOpenAIImageSize,
} from '@/features/image-generation/image-size'
import { devGenerateImages } from '@/features/image-generation/repositories/dev-image-generation.rest.repository'
import {
	resolveGeneratedImageReference,
	storeGeneratedImages,
} from '@/features/image-generation/repositories/generated-image.payload.repository'
import {
	generateBrandImages,
	getImageModelApiKey,
	type ImageGenerationProvider,
} from '@/features/image-generation/repositories/image-generation.ai.repository'
import { findPublishedImageProfile } from '@/features/image-generation/repositories/image-profile.payload.repository'
import type { ImageGenerationResult } from '@/features/image-generation/services/generate-image.client'
import {
	ImageGenerationUnavailableError,
	normalizeImageProfilePrompt,
} from '@/features/image-generation/services/normalize-image-profile-prompt.service'
import { acceptsControllerExecutionValue } from '@/modules/studio-controller/controller-definition'

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

/** published Controller Definition이 허용하지 않는 입력을 모든 생성 진입점에서 같은 오류로 거부한다. */
export class InvalidImageControllerInputError extends Error {
	constructor(controlId: string) {
		super(`Image controller rejected ${controlId}.`)
		this.name = 'InvalidImageControllerInputError'
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
		id: number
		imageModelPreset: ImageModelPreset
		name: string
	},
	input: {
		prompt: string
		count: number
		seedImage?: Uint8Array
		aspectRatio: ImageAspectRatio
		imageSize: ImageOutputSize
	},
): ImageGenerationPlan {
	return {
		prompt: input.prompt,
		count: input.count,
		modelPreset: profile.imageModelPreset,
		aspectRatio: input.aspectRatio,
		imageSize: input.imageSize,
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
 * 유스케이스 경계: 선택한 published 프로파일로 이미지를 생성한다.
 * 참조 이미지는 선택 입력이다 — 참조가 없으면 프롬프트만으로, 있으면 그 이미지를 시드로 쓴다.
 * 프로파일 조회·참조 해석·모델 호출·생성 파일 저장 I/O는 각 repository가 소유한다.
 */
export async function generateImages({
	userInput,
	profileId,
	user,
	count,
	aspectRatio,
	imageSize,
	camera,
	reference,
}: {
	userInput: string
	profileId: number
	user: unknown
	count: number
	/** 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율. */
	aspectRatio?: ImageAspectRatio
	/** 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도. */
	imageSize?: ImageOutputSize
	/** 카메라 컨트롤 값 — feature가 열려 있을 때만 허용된다. */
	camera?: CameraControlInput
	/** 참조 이미지 — 지금은 내 생성 결과만 소스다. */
	reference?: { generatedImageId: number; requestUrl: string }
}): Promise<GeneratedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const config = deriveImageStudioConfig(profile)

	const resolved = reference
		? await resolveGeneratedImageReference({ ...reference, profileId, user })
		: null
	if (reference && !resolved) throw new InvalidSeedImageError()

	// 프롬프트를 새로 썼으면 그것을 정규화해 쓰고, 비워 뒀으면 참조가 준 프롬프트를 물려받는다.
	const trimmed = userInput.trim()
	const effective = trimmed
		? resolveImageGenerationInput(config, { userInput, count, aspectRatio, imageSize })
		: { userInput: '', ...resolveImageGenerationOptions(config, { count, aspectRatio, imageSize }) }
	const inherited = resolved?.prompt
	if (!trimmed && !inherited) throw new InvalidImageControllerInputError('prompt')

	const composed = trimmed
		? JSON.stringify(
				(
					await normalizeImageProfilePrompt({
						profilePrompt: profile.profilePrompt,
						userPromptNormalization: profile.userPromptNormalization ?? [],
						userPrompt: effective.userInput,
					})
				).finalPrompt,
			)
		: (inherited as { effective: string }).effective

	const prompt = camera
		? composeCameraAdjustmentPrompt(assertFlatPrompt(composed), resolveCameraFeature(config, camera))
		: composed

	const plan = planImageGenerationFromProfile(profile, {
		prompt,
		count: effective.count,
		aspectRatio: effective.aspectRatio,
		imageSize: effective.imageSize,
		...(resolved ? { seedImage: resolved.data } : {}),
	})
	const generated = await runImageGeneration(plan, user)
	return storeProfileGeneration(generated, {
		inputPrompt: trimmed ? userInput : (inherited as { input: string }).input,
		// 저장 메타데이터의 비율·해상도는 실제 생성에 쓴 plan이 정본 — 오버라이드 시 프로파일 값과 다르다.
		profile: {
			id: profile.id,
			name: profile.name,
			aspectRatio: plan.aspectRatio,
			imageSize: plan.imageSize,
		},
		...(resolved?.generatedImageId ? { sourceImage: resolved.generatedImageId } : {}),
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
	camera,
	count,
	generatedImageId,
	profileId,
	requestUrl,
	user,
}: {
	camera: CameraControlInput
	count: number
	generatedImageId: number
	profileId: number
	requestUrl: string
	user: unknown
}): Promise<CameraAdjustedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const config = deriveImageStudioConfig(profile)
	const cameraFeature = getImageStudioFeature(config, 'camera-control')
	if (!cameraFeature) {
		throw new InvalidImageControllerInputError('camera')
	}
	const seed = await resolveGeneratedImageReference({
		generatedImageId,
		profileId,
		requestUrl,
		user,
	})
	if (!seed?.prompt) throw new InvalidSeedImageError()
	const effectivePrompt = imageEffectivePromptSchema.safeParse(seed.prompt.effective)
	if (!effectivePrompt.success) throw new InvalidSeedImageError()

	// 각도는 신뢰 경계에서 다시 검증한다 — UI가 구간을 좁혀도 요청은 임의 각도를 보낼 수 있다.
	const resolved = resolveCameraControl(camera)
	if (
		!cameraFeature.azimuths.includes(resolved.azimuth) ||
		!cameraFeature.elevations.includes(resolved.elevation)
	) {
		throw new InvalidImageControllerInputError('camera')
	}
	const effective = resolveImageGenerationOptions(config, { count })
	const result = await runImageGeneration(
		planImageGenerationFromProfile(profile, {
			prompt: composeCameraAdjustmentPrompt(effectivePrompt.data, resolved),
			count: effective.count,
			aspectRatio: effective.aspectRatio,
			imageSize: effective.imageSize,
			seedImage: seed.data,
		}),
		user,
	)
	const stored = await storeProfileGeneration(result, {
		inputPrompt: seed.prompt.input,
		profile: {
			id: profile.id,
			name: profile.name,
			aspectRatio: effective.aspectRatio,
			imageSize: effective.imageSize,
		},
		sourceImage: generatedImageId,
		user,
	})

	return {
		...stored,
		camera: { input: camera, resolved },
	}
}

/** 카메라 값을 feature 허용 범위 안에서 해석한다. 신뢰 경계에서 다시 검증한다 — UI가 좁혀도 요청은 임의 각도를 보낼 수 있다. */
function resolveCameraFeature(
	config: ImageStudioConfig,
	camera: CameraControlInput,
): ResolvedCameraControl {
	const feature = getImageStudioFeature(config, 'camera-control')
	if (!feature) throw new InvalidImageControllerInputError('camera')
	const resolved = resolveCameraControl(camera)
	if (
		!feature.azimuths.includes(resolved.azimuth) ||
		!feature.elevations.includes(resolved.elevation)
	) {
		throw new InvalidImageControllerInputError('camera')
	}
	return resolved
}

/** 프롬프트 키를 얹으려면 flat JSON이어야 한다. 물려받은 프롬프트가 깨져 있으면 여기서 막는다. */
function assertFlatPrompt(prompt: string): string {
	const parsed = imageEffectivePromptSchema.safeParse(prompt)
	if (!parsed.success) throw new InvalidSeedImageError()
	return parsed.data
}

function resolveImageGenerationInput(
	config: ImageStudioConfig,
	input: {
		userInput: string
		count: number
		aspectRatio?: ImageAspectRatio
		imageSize?: ImageOutputSize
	},
) {
	const { prompt } = getImageStudioControls(config)
	assertTextInput(prompt, input.userInput)
	return { userInput: input.userInput, ...resolveImageGenerationOptions(config, input) }
}

function resolveImageGenerationOptions(
	config: ImageStudioConfig,
	input: {
		count: number
		aspectRatio?: ImageAspectRatio
		imageSize?: ImageOutputSize
	},
) {
	const { batch, ratio, resolution } = getImageStudioControls(config)
	const batchValue = String(input.count)
	const ratioValue = input.aspectRatio ?? ratio.defaultValue
	const resolutionValue = input.imageSize ?? resolution.defaultValue
	assertSelectInput(batch, batchValue)
	assertSelectInput(ratio, ratioValue)
	assertSelectInput(resolution, resolutionValue)
	if (ratioValue === null || resolutionValue === null) {
		throw new InvalidImageControllerInputError(ratioValue === null ? ratio.id : resolution.id)
	}
	return {
		count: Number(batchValue),
		aspectRatio: ratioValue as ImageAspectRatio,
		imageSize: resolutionValue as ImageOutputSize,
	}
}

function assertTextInput(
	control: Extract<ReturnType<typeof getImageStudioControls>['prompt'], { kind: 'text' }>,
	value: string,
) {
	if (!acceptsImagePromptExecution(control, value)) {
		throw new InvalidImageControllerInputError(control.id)
	}
}

function assertSelectInput(
	control: Extract<ReturnType<typeof getImageStudioControls>['batch'], { kind: 'select' }>,
	value: string | null,
) {
	if (value === null || !acceptsControllerExecutionValue(control, value)) {
		throw new InvalidImageControllerInputError(control.id)
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
		sourceImage,
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
		/** 참조해서 만든 결과면 그 원본 생성 이미지 id. */
		sourceImage?: number
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
		...(sourceImage ? { sourceImage } : {}),
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
