// ⚠️ 임시 — development + IMAGE_DEV_FALLBACK=true에서만 쓰는 dev 폴백.
// Pollinations FLUX(무료·키/가입 불필요). 키 오면 이 파일과 generate-image.service.ts의 폴백 분기를 통째로 삭제.
// ⚠️ 프롬프트가 외부 무료 서비스로 전송된다 — 민감 입력 금지.
import type { ImageSize } from '@/features/image-generation/image-size'

/** Pollinations REST 후보를 병렬 요청해 성공분만 data URI로 반환한다. */
export async function devGenerateImages(
	prompt: string,
	size: ImageSize,
	n: number,
): Promise<string[]> {
	const [width, height] = size.split('x')
	const base = Math.floor(Math.random() * 1_000_000)
	const results = await Promise.all(
		Array.from({ length: n }, (_, i) => fetchImage(prompt, width, height, base + i)),
	)
	return results.filter((uri): uri is string => uri !== null)
}

async function fetchImage(
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
