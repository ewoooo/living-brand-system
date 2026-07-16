'use client'

import { useEffect, useState } from 'react'

// 폰트 글리프 인스펙터: 좌측 정사각형에 선택된 글자를 크게, 우측에 글리프 목록(정사각형 셀)을 둔다.
// 셀에 호버(또는 포커스)하면 좌측 큰 글자가 그 글리프로 갱신된다. 우측은 고정 8열 연속 그리드.
// 좌측 큰 글자 뒤에는 폰트 메트릭 가이드라인을 그린다. Essenflux는 모든 글자가 윗선에 걸리는
// 빨랫줄(hanging) 글꼴이라, 일반적인 cap/x-height 대신 다음으로 정의한다:
//   - ascender / descender: 폰트 선언 메트릭(fontBoundingBox).
//   - headline: 모든 글자가 걸리는 윗선(대문자·소문자 잉크 top의 최댓값, 픽셀 측정).
//   - baseline: 풀높이 글자가 앉는 선.
//   - 작은 소문자 아랫선(작은 소문자 잉크 bottom의 최솟값, 픽셀 측정): 선만 긋는다(x-height 라벨은 보류).
// 픽셀 측정: Canvas에 글자를 그려 잉크 경계를 읽는다(별도 라이브러리 없음). 폰트는 --font-title
// 토큰을 읽어 브랜드 무관. SVG로 글자·라인을 같은 em 좌표계(1em=100)에 그려 정렬이 정확하다.
// 이중 border 방지: 그리드 컨테이너에 top/left, 각 셀에 right/bottom만 둬서 경계선이 겹치지 않게 한다.
// 한글 등 Essenflux에 없는 글리프는 Pretendard로 폴백.

const GLYPHS = [
	...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	...'abcdefghijklmnopqrstuvwxyz',
	...'0123456789&@.,:;!?*#%/()-',
]

// 작은 소문자(ascender/descender 없는 글자) — 아랫선으로 x-height를 잡는다.
const SMALL = [...'acemnorsuvwxz']

const codepoint = (ch: string) =>
	`U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`

type Metrics = { ascender: number; descender: number; headline: number; xLine: number }

export function GlyphGrid() {
	const [active, setActive] = useState('A')
	const [metrics, setMetrics] = useState<Metrics | null>(null)

	useEffect(() => {
		let cancelled = false
		const fontStack =
			getComputedStyle(document.documentElement).getPropertyValue('--font-title').trim() ||
			'sans-serif'
		document.fonts.ready.then(() => {
			if (cancelled) return
			const S = 200
			const base = 300
			const W = 400
			const Hc = 560
			const canvas = document.createElement('canvas')
			canvas.width = W
			canvas.height = Hc
			const ctx = canvas.getContext('2d', { willReadFrequently: true })
			if (!ctx) return
			ctx.font = `${S}px ${fontStack}`
			ctx.textBaseline = 'alphabetic'

			// baseline(y=base) 기준으로 잉크 윗선/아랫선을 em 비율로 반환(+면 baseline 위).
			const bounds = (ch: string) => {
				ctx.clearRect(0, 0, W, Hc)
				ctx.fillStyle = '#000'
				ctx.fillText(ch, 60, base)
				const data = ctx.getImageData(0, 0, W, Hc).data
				let top = -1
				let bot = -1
				for (let y = 0; y < Hc && top < 0; y++)
					for (let x = 0; x < W; x++)
						if (data[(y * W + x) * 4 + 3] > 10) {
							top = y
							break
						}
				for (let y = Hc - 1; y >= 0 && bot < 0; y--)
					for (let x = 0; x < W; x++)
						if (data[(y * W + x) * 4 + 3] > 10) {
							bot = y
							break
						}
				return { top: (base - top) / S, bot: (base - bot) / S }
			}

			const headline = Math.max(...['H', 'h', 'b', ...SMALL].map((c) => bounds(c).top))
			const xLine = Math.min(...SMALL.map((c) => bounds(c).bot))
			const m = ctx.measureText('H')
			const next = {
				ascender: m.fontBoundingBoxAscent / S,
				descender: m.fontBoundingBoxDescent / S,
				headline,
				xLine,
			}
			// 폰트 미준비 등으로 측정이 어긋나면 NaN이 SVG로 새지 않도록 유한값일 때만 반영.
			if (Object.values(next).every((v) => Number.isFinite(v))) setMetrics(next)
		})
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<div className="relative aspect-square overflow-hidden rounded-sm border border-border bg-background-tertiary">
				{metrics && Number.isFinite(metrics.headline) ? (
					<GlyphStage glyph={active} metrics={metrics} />
				) : (
					<div className="flex size-full items-center justify-center">
						<span
							className="text-foreground"
							style={{
								fontFamily: 'var(--font-title)',
								fontSize: 'clamp(11rem,34vw,26rem)',
								lineHeight: 1,
							}}
						>
							{active}
						</span>
					</div>
				)}
				<span className="type-caption-1 absolute bottom-4 left-4 text-foreground-muted tabular-nums">
					{codepoint(active)}
				</span>
			</div>

			<div className="grid grid-cols-8 self-start rounded-sm border-border border-t border-l">
				{GLYPHS.map((ch) => (
					<button
						key={ch}
						type="button"
						onMouseEnter={() => setActive(ch)}
						onFocus={() => setActive(ch)}
						data-active={ch === active}
						aria-label={`${ch} (${codepoint(ch)})`}
						className="flex aspect-square items-center justify-center border-border border-r border-b text-4xl text-foreground transition-colors hover:bg-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 data-[active=true]:bg-fill-selected"
						style={{ fontFamily: 'var(--font-title)' }}
					>
						{ch}
					</button>
				))}
			</div>
		</div>
	)
}

// 메트릭 라인 + 글자를 같은 em 좌표계(1em=100)에 SVG로 렌더. baseline은 y=ascender*100.
function GlyphStage({ glyph, metrics }: { glyph: string; metrics: Metrics }) {
	const { ascender, descender, headline, xLine } = metrics
	const PAD = 8
	const baseY = ascender * 100
	const total = (ascender + descender) * 100

	const yHead = baseY - headline * 100
	const yX = baseY - xLine * 100

	const guides = [
		{ y: 0, label: 'ascender' },
		{ y: yHead, label: 'headline' },
		{ y: baseY, label: 'baseline' },
		{ y: baseY + descender * 100, label: 'descender' },
	]

	return (
		<svg
			viewBox={`0 ${-PAD} 100 ${total + PAD * 2}`}
			preserveAspectRatio="xMidYMid meet"
			className="size-full"
			role="img"
			aria-label={`${glyph} 글리프와 폰트 메트릭 가이드`}
		>
			<g className="text-border" stroke="currentColor" strokeWidth={0.4}>
				{guides.map((l) => (
					<line key={l.label} x1={0} x2={100} y1={l.y} y2={l.y} />
				))}
				{/* 작은 소문자 아랫선(x-height 경계) — 파생선이라 점선 */}
				<line x1={0} x2={100} y1={yX} y2={yX} strokeDasharray="2 2" />
			</g>

			<text
				x={50}
				y={baseY}
				textAnchor="middle"
				fontSize={100}
				className="text-foreground"
				fill="currentColor"
				style={{ fontFamily: 'var(--font-title)' }}
			>
				{glyph}
			</text>

			<g
				className="text-foreground-muted"
				fill="currentColor"
				style={{ fontFamily: 'var(--font-sans)' }}
			>
				{guides.map((l) => (
					<text key={l.label} x={99} y={l.y - 1.5} textAnchor="end" fontSize={4}>
						{l.label}
					</text>
				))}
			</g>
		</svg>
	)
}
