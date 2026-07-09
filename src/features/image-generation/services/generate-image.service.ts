import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import { composeImageRequest, type ImageSize } from '@/features/image-generation/presets'

const DEFAULT_MODEL = 'gpt-image-2'

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	prompt: string
	images: string[]
}

/**
 * 유스케이스 경계: 사용자 입력(+프리셋)을 받아 이미지 후보 N장을 생성해 data URI로 돌려준다.
 * 외부 I/O(OpenAI 또는 임시 dev 프로바이더 호출)는 이 모듈이 소유하고, 상위(route·agent tool)는
 * 인증·검증만 담당한다 (docs/06 §6). 키가 있으면 사내 gpt-image, 없으면 dev 폴백을 쓴다.
 */
export async function generateImageCandidates({
	userInput,
	presetId,
	count,
}: {
	userInput: string
	presetId?: string
	count: number
}): Promise<string[]> {
	const { prompt, size } = composeImageRequest(userInput, presetId)
	if (env.OPENAI_API_KEY) {
		return generateBrandImages({ prompt, count, size })
	}
	return devGenerate(prompt, size, count)
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

// ponytail: 임시 dev 프로바이더 (Pollinations FLUX, 키·가입 불필요). 서버에서 순차 fetch 후
// data URI로 반환해 브라우저의 외부 이미지 로드 누락을 없앤다. OPENAI_API_KEY 오면 위 gpt-image
// 경로만 타므로 아래 두 함수를 통째로 지우면 됨. 프롬프트가 외부 무료 서비스로 전송됨 — 민감 입력 금지.
async function fetchPollinationsDataUri(
	prompt: string,
	width: string,
	height: string,
	seed: number,
): Promise<string | null> {
	const query = new URLSearchParams({
		width,
		height,
		seed: String(seed),
		nologo: 'true',
		model: 'flux',
	})
	const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query}`
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
			if (!res.ok) continue
			const buffer = Buffer.from(await res.arrayBuffer())
			const mediaType = res.headers.get('content-type') ?? 'image/jpeg'
			return `data:${mediaType};base64,${buffer.toString('base64')}`
		} catch {
			// 타임아웃/네트워크 오류 → 재시도
		}
	}
	return null
}

async function devGenerate(prompt: string, size: ImageSize, n: number): Promise<string[]> {
	const [width, height] = size.split('x')
	const base = Math.floor(Math.random() * 1_000_000)
	const images: string[] = []
	for (let i = 0; i < n; i++) {
		const uri = await fetchPollinationsDataUri(prompt, width, height, base + i)
		if (uri) images.push(uri)
	}
	return images
}
