/**
 * 이미지 생성 클라이언트 서비스 — 브라우저에서 /api/image 호출의 요청/응답 계약을 소유한다.
 * 생성 실행·인증은 route 뒤의 generate-image service가 담당하고,
 * 화면 상태(로딩·에러 표시)는 호출자(useImageGeneration, Admin AiImageForm)가 담당한다.
 */
export interface ImageGenerationRequest {
	count: number
	prompt: string
	sceneId?: string
}

export interface ImageGenerationResult {
	images: string[]
	prompt: string
	sceneId: string
}

/** 이미지 후보 생성을 요청한다. 실패하면 status를 담아 throw하고, 호출자가 화면 메시지로 바꾼다. */
export async function generateImages(
	input: ImageGenerationRequest,
): Promise<ImageGenerationResult> {
	const response = await fetch('/api/image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) throw new Error(`생성 실패 (${response.status})`)
	return (await response.json()) as ImageGenerationResult
}
