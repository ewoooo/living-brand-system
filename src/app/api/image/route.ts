import { env } from '@/env'
import { generateBrandImages } from '@/features/image-generation/services/generate-image.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 60

const COLORS = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#a5b4fc', '#fca5a5', '#86efac']

function placeholder(prompt: string, i: number): string {
	const bg = COLORS[i % COLORS.length]
	const label = prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="${bg}"/>
<text x="256" y="248" font-family="sans-serif" font-size="20" fill="#334155" text-anchor="middle">placeholder ${i + 1}</text>
<text x="256" y="278" font-family="sans-serif" font-size="14" fill="#475569" text-anchor="middle">${label.replace(/[<&>]/g, '')}</text>
</svg>`
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { prompt, count } = (await request.json().catch(() => ({}))) as {
		prompt?: string
		count?: number
	}
	if (!prompt?.trim()) {
		return Response.json({ message: 'prompt required' }, { status: 400 })
	}
	const n = Math.min(Math.max(count ?? 4, 1), 6)

	// ponytail: 키 없으면 dev 폴백(무료 가짜 이미지, 인증 없음). 키가 있으면 아래 유료 경로로 감.
	if (!env.OPENAI_API_KEY) {
		const images = Array.from({ length: n }, (_, i) => placeholder(prompt, i))
		return Response.json({ images })
	}

	// 유료 경로 — 인증 게이트 (docs/07)
	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const images = await generateBrandImages({ prompt, count: n })
		return Response.json({ images })
	} catch (error) {
		payload.logger.error({ err: error }, 'image-generation.failed')
		return Response.json({ message: 'Image generation failed.' }, { status: 500 })
	}
}
