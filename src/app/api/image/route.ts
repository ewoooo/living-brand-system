import { NextResponse } from 'next/server'

// ponytail: placeholder 생성기. 실제 이미지 프로바이더(예: @ai-sdk/google generateImage)로 교체할 자리.
// 교체 시 함께 붙일 것: (1) 요청 인증(authenticateRequest) — 유료 호출이라 게이트 필요, (2) 새 env 키.

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
	const { prompt, count } = (await request.json()) as { prompt?: string; count?: number }
	if (!prompt?.trim()) {
		return NextResponse.json({ error: 'prompt required' }, { status: 400 })
	}
	const n = Math.min(Math.max(count ?? 4, 1), 6)
	const images = Array.from({ length: n }, (_, i) => placeholder(prompt, i))
	return NextResponse.json({ images })
}
