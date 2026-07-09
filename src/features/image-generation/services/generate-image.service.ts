import { openai } from '@ai-sdk/openai'
import { generateImage } from 'ai'
import { env } from '@/env'
import type { ImageSize } from '@/features/image-generation/presets'
import { buildImagePrompt } from '@/features/image-generation/services/prompt-decorator.service'

const DEFAULT_MODEL = 'gpt-image-2'

/** generateImage 도구/route가 챗에 붙이는 생성 결과 첨부 계약 (이중 정의 금지). */
export interface AgentGeneratedImagesAttachment {
	type: 'generated-images'
	/** 실제로 이미지 모델에 들어간 합성 프롬프트 (디버깅·재현용). */
	prompt: string
	/** 실제 적용된 Scene id ('free'|scene id). */
	sceneId?: string
	images: string[]
}

/**
 * 유스케이스 경계: 사용자 입력(+Scene)을 받아 이미지 후보 N장을 생성해 data URI로 돌려준다.
 * 합성 프롬프트·적용 Scene도 함께 반환해 상위 표면이 결과 품질을 디버깅·재현할 수 있게 한다(R&D 방식).
 * 프롬프트 합성(Text Decorator)은 prompt-decorator 서비스가, 프로바이더 호출 I/O는 이 모듈이 소유하고,
 * 상위(route·agent tool)는 인증·검증만 담당한다 (docs/06 §6). 키가 있으면 사내 gpt-image, 없으면 dev 폴백.
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
	const {
		prompt,
		size,
		sceneId: resolvedSceneId,
	} = await buildImagePrompt({ userInput, sceneId })
	const images = env.OPENAI_API_KEY
		? await generateBrandImages({ prompt, count, size })
		: await devGenerate(prompt, size, count)
	return { images, prompt, sceneId: resolvedSceneId }
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

// ponytail: 임시 dev 프로바이더 (Pollinations FLUX, 키·가입 불필요). 서버에서 fetch 후 data URI로
// 반환해 브라우저의 외부 이미지 로드 누락을 없앤다. OPENAI_API_KEY 오면 위 gpt-image 경로만 타므로
// 아래 두 함수를 통째로 지우면 됨. 프롬프트가 외부 무료 서비스로 전송됨 — 민감 입력 금지.
// 무료 서버가 느리므로 재시도(합산 지연) 대신 단일 시도·긴 타임아웃(한 번 충분히 대기)로 성공률을 높인다.
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
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(50_000) })
		if (!res.ok) return null
		const buffer = Buffer.from(await res.arrayBuffer())
		const mediaType = res.headers.get('content-type') ?? 'image/jpeg'
		return `data:${mediaType};base64,${buffer.toString('base64')}`
	} catch {
		return null
	}
}

// 후보는 seed가 서로 독립이라 병렬로 요청한다 — 벽시계가 합산이 아닌 최댓값이 돼 route maxDuration 안에 든다.
// 부분 실패는 성공분만 남긴다(빈 배열이면 상위가 502/실패 처리).
async function devGenerate(prompt: string, size: ImageSize, n: number): Promise<string[]> {
	const [width, height] = size.split('x')
	const base = Math.floor(Math.random() * 1_000_000)
	const settled = await Promise.allSettled(
		Array.from({ length: n }, (_, i) =>
			fetchPollinationsDataUri(prompt, width, height, base + i),
		),
	)
	return settled
		.map((result) => (result.status === 'fulfilled' ? result.value : null))
		.filter((uri): uri is string => uri !== null)
}
