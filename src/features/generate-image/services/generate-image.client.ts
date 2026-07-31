/**
 * 이미지 생성 클라이언트 서비스 — 사용자/Admin 생성 요청의 HTTP 계약을 소유한다.
 * 생성 실행·인증은 route 뒤의 generate-image service가 담당하고,
 * 화면 상태(로딩·에러 표시)는 호출자(useImageGeneration, Admin AiImageForm)가 담당한다.
 */

import type {
	CameraAdjustmentRequest,
	CameraControlInput,
	ResolvedCameraControl,
} from '@/features/generate-image/camera-control'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'

export interface ImageGenerationRequest {
	count: number
	prompt: string
	profileId: number
}

type AdminImageGenerationRequest = {
	count: number
	prompt: string
} & (
	| {
			aspectRatio: ImageAspectRatio
			imageModelPreset: ImageModelPreset
			imageSize: ImageOutputSize
			profileId?: never
	  }
	| {
			aspectRatio?: never
			imageModelPreset?: never
			imageSize?: never
			profileId: number
	  }
)

export interface ImageProfileOption {
	id: number
	name: string
}

export interface GeneratedImageReference {
	collection: 'generated-images'
	createdAt: string
	id: number
	url: string
}

export interface ImageGenerationResult {
	aspectRatio?: ImageAspectRatio
	generatedImages?: GeneratedImageReference[]
	images: string[]
	imageSize?: ImageOutputSize
	model: string
	prompt: string
	profileId?: number
	profileName?: string
	seedImages?: string[]
}

export interface CameraAdjustmentResult extends ImageGenerationResult {
	camera: {
		input: CameraControlInput
		resolved: ResolvedCameraControl
	}
}

/** 사용자 이미지 생성을 요청한다. */
export function requestImageGeneration(
	input: ImageGenerationRequest,
): Promise<ImageGenerationResult> {
	return postImageGeneration<ImageGenerationResult>('/api/generate-image', input)
}

/** Admin 이미지 생성을 요청한다. */
export function requestAdminImageGeneration(
	input: AdminImageGenerationRequest,
): Promise<ImageGenerationResult> {
	return postImageGeneration<ImageGenerationResult>('/api/admin/generate-image', input)
}

/** 생성된 이미지를 시드로 사용해 카메라 시점을 조정한다. */
export function requestCameraAdjustment(
	input: CameraAdjustmentRequest,
): Promise<CameraAdjustmentResult> {
	return postImageGeneration<CameraAdjustmentResult>(
		'/api/generate-image/camera-adjustment',
		input,
	)
}

/** Payload REST에서 현재 사용자가 선택할 수 있는 published 이미지 프로파일을 조회한다. */
export async function requestPublishedImageProfiles(): Promise<ImageProfileOption[]> {
	const response = await fetch(
		'/api/image-profiles?depth=0&limit=100&sort=displayOrder&select[id]=true&select[name]=true',
	)
	if (!response.ok) throw new Error('이미지 프로파일을 불러오지 못했습니다.')
	const body = (await response.json()) as { docs?: ImageProfileOption[] }
	return Array.isArray(body.docs) ? body.docs : []
}

async function postImageGeneration<Result extends ImageGenerationResult>(
	url: string,
	input: AdminImageGenerationRequest | CameraAdjustmentRequest | ImageGenerationRequest,
): Promise<Result> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) throw new Error(`생성 실패 (${response.status})`)
	return (await response.json()) as Result
}
