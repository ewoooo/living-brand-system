import { env } from '@/env'
import { composeImageRequest } from '@/features/image-generation/presets'
import { generateBrandImages } from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

// ponytail: 임시 dev 프로바이더 (Pollinations FLUX, 키·가입 불필요). 실제 생성 파이프라인 검증용.
// 서버에서 순차 fetch 후 data URI로 반환해 브라우저의 외부 이미지 로드 누락을 없앤다.
// OPENAI_API_KEY 오면 이 두 함수와 아래 no-key 분기를 통째로 지우면 됨. 프롬프트가 외부 무료 서비스로 전송됨 — 민감 입력 금지.
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

async function devGenerate(prompt: string, size: string, n: number): Promise<string[]> {
	const [width, height] = size.split('x')
	const base = Math.floor(Math.random() * 1_000_000)
	const images: string[] = []
	for (let i = 0; i < n; i++) {
		const uri = await fetchPollinationsDataUri(prompt, width, height, base + i)
		if (uri) images.push(uri)
	}
	return images
}

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const {
		prompt: userInput,
		count,
		presetId,
	} = (await request.json().catch(() => ({}))) as {
		prompt?: string
		count?: number
		presetId?: string
	}
	if (!userInput?.trim()) {
		return Response.json({ message: 'prompt required' }, { status: 400 })
	}
	const n = Math.min(Math.max(count ?? 4, 1), 6)
	const { prompt, size } = composeImageRequest(userInput, presetId)

	// 키 없으면 임시 dev 프로바이더로 실제 이미지 반환(인증 없음). 키 있으면 아래 유료 경로.
	if (!env.OPENAI_API_KEY) {
		const images = await devGenerate(prompt, size, n)
		if (images.length === 0) {
			return Response.json({ message: '임시 프로바이더 생성 실패' }, { status: 502 })
		}
		return Response.json({ images })
	}

	// 유료 경로 — 인증 게이트 (docs/07)
	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const images = await generateBrandImages({ prompt, count: n, size })
		return Response.json({ images })
	} catch (error) {
		payload.logger.error({ err: error }, 'image-generation.failed')
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
