import { env } from '@/env'
import { composeImageRequest, type ImageSize } from '@/features/image-generation/presets'
import { generateBrandImages } from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const COLORS = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#a5b4fc', '#fca5a5', '#86efac']

function placeholder(label: string, size: ImageSize, i: number): string {
	const bg = COLORS[i % COLORS.length]
	const [w, h] = size.split('x').map(Number)
	const text = label.length > 40 ? `${label.slice(0, 40)}…` : label
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${bg}"/>
<text x="${w / 2}" y="${h / 2 - 8}" font-family="sans-serif" font-size="28" fill="#334155" text-anchor="middle">placeholder ${i + 1}</text>
<text x="${w / 2}" y="${h / 2 + 24}" font-family="sans-serif" font-size="18" fill="#475569" text-anchor="middle">${text.replace(/[<&>]/g, '')}</text>
</svg>`
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
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

	// ponytail: 키 없으면 dev 폴백(무료 가짜 이미지, 인증 없음). 키가 있으면 아래 유료 경로로 감.
	if (!env.OPENAI_API_KEY) {
		const images = Array.from({ length: n }, (_, i) => placeholder(userInput, size, i))
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
