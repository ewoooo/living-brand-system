/**
 * 이미지 생성 클라이언트 서비스 — 사용자/Admin 생성 요청의 HTTP 계약을 소유한다.
 * 생성 실행·인증은 route 뒤의 generate-image service가 담당하고,
 * 화면 상태(로딩·에러 표시)는 호출자(useImageGeneration, Admin AiImageForm)가 담당한다.
 */
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'

export interface ImageGenerationRequest {
	count: number
	prompt: string
	profileId?: number
}

type AdminImageGenerationRequest = {
	count: number
	prompt: string
} & (
	| {
			aspectRatio: ImageAspectRatio
			imageModelPreset: ImageModelPreset
			imageSize: ImageOutputSize
	  }
	| {
			aspectRatio?: never
			imageModelPreset?: never
			imageSize?: never
	  }
)

export interface ImageGenerationResult {
	images: string[]
	model: string
	prompt: string
	profileId?: number
	profileName?: string
}

/** 사용자 이미지 생성을 요청한다. */
export function requestImageGeneration(
	input: ImageGenerationRequest,
): Promise<ImageGenerationResult> {
	return postImageGeneration('/api/generate-image', input)
}

/** Admin 이미지 생성을 요청한다. */
export function requestAdminImageGeneration(
	input: AdminImageGenerationRequest,
): Promise<ImageGenerationResult> {
	return postImageGeneration('/api/admin/generate-image', input)
}

async function postImageGeneration(
	url: string,
	input: ImageGenerationRequest | AdminImageGenerationRequest,
): Promise<ImageGenerationResult> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) throw new Error(`생성 실패 (${response.status})`)
	return (await response.json()) as ImageGenerationResult
}
