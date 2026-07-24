'use client'

import { useState } from 'react'
import { MAIN, MULTI } from './color-palette'
import { MiniPalette, type MiniSwatch } from './mini-palette'

/**
 * 로고 컬러 체인저 — 왼쪽 미니 팔레트(전경색) · 가운데 스테이지(배경 + 로고 텍스트) · 오른쪽 미니 팔레트(배경색).
 * Tone in Tone 페어링 규칙(essenherb p.26)으로 한쪽을 고르면 반대쪽이 3그룹(선택불가/가능/추천)으로 나뉜다.
 * 앵커 = 마지막에 고른 쪽(자유 선택), 반대쪽이 앵커에 종속되어 제한된다. 어느 쪽을 먼저 골라도 동일 규칙.
 * 브랜드 무관: 색·행 구성·워드마크는 props.
 */

// BG 톤 → 허용 FG 톤 (p.26 매트릭스). 전경은 배경과 "다른 색상 계열"이어야 한다(아래에서 별도 체크).
const TONE_MATRIX: Record<number, number[]> = {
	1: [3, 4, 5],
	2: [4, 5],
	3: [1, 3, 5],
	4: [1, 2, 3],
	5: [1, 2, 3],
}
const toneAllowed = (bgTone: number, fgTone: number) =>
	TONE_MATRIX[bgTone]?.includes(fgTone) ?? false

// id 규약('<family>-<tone>' | 'main-<name>')에서 계열/톤을 파생. 중립(white/black)은 tone=null.
type Meta = { family: string; tone: number | null }
function metaOf(id: string): Meta {
	const [head, tail] = id.split('-')
	const tone = /^[1-5]$/.test(tail ?? '') ? Number(tail) : null
	return { family: tone ? head : 'neutral', tone }
}

// 앵커(anchorMeta)에 종속된 반대쪽 후보들을 3그룹으로 계산.
// dependentIsFg=true면 후보가 전경(앵커=배경), false면 후보가 배경(앵커=전경).
function computeGroups(anchorMeta: Meta, dependentIsFg: boolean, flat: MiniSwatch[]) {
	const disabled: string[] = []
	const recommended: string[] = []
	for (const c of flat) {
		const m = metaOf(c.id)
		const okTone =
			anchorMeta.tone != null &&
			m.tone != null &&
			(dependentIsFg
				? toneAllowed(anchorMeta.tone, m.tone)
				: toneAllowed(m.tone, anchorMeta.tone))
		const ok = okTone && m.family !== anchorMeta.family
		if (!ok) disabled.push(c.id)
		// ponytail: 추천 = 핵심 톤(3) 임시 규칙. 실제 40종은 p27/28 큐레이션 데이터 확보 후 교체.
		else if (m.tone === 3) recommended.push(c.id)
	}
	return { disabled, recommended }
}

// 캔버스 테스트 객체: 로고 / 일반 텍스트 / 랜덤 아이콘. 로고·아이콘은 SVG 실루엣을 mask로 재색.
const CANVAS_OBJECTS = [
	{ value: 'logo', label: '로고' },
	{ value: 'text', label: '텍스트' },
	{ value: 'icon', label: '아이콘' },
] as const
type CanvasObject = (typeof CANVAS_OBJECTS)[number]['value']
const ICON_SRCS = [1, 2, 3, 4, 5, 7].map((n) => `/kit-sample-icons/${n}.svg`)
const randomIcon = () => ICON_SRCS[Math.floor(Math.random() * ICON_SRCS.length)]

// SVG 실루엣을 color로 재색하는 mask 스타일(icon-grid와 동일 기법: 배경색 + alpha 마스크).
const maskStyle = (src: string, color: string) =>
	({
		backgroundColor: color,
		maskImage: `url(${src})`,
		maskRepeat: 'no-repeat',
		maskPosition: 'center',
		maskSize: 'contain',
		WebkitMaskImage: `url(${src})`,
		WebkitMaskRepeat: 'no-repeat',
		WebkitMaskPosition: 'center',
		WebkitMaskSize: 'contain',
	}) as const

export function LogoColorChanger({
	rows,
	logoSrc,
	wordmark = 'Essenherb',
	defaultFgId,
	defaultBgId,
}: {
	rows: MiniSwatch[][]
	/** 로고 객체로 그릴 SVG 실루엣 경로(단색, mask로 재색). */
	logoSrc: string
	/** 텍스트 객체로 그릴 문구. */
	wordmark?: string
	defaultFgId: string
	defaultBgId: string
}) {
	const flat = rows.flat()
	const [fgId, setFgId] = useState(defaultFgId)
	const [bgId, setBgId] = useState(defaultBgId)
	// 앵커 = 자유 선택 쪽. 반대쪽이 제한된다.
	const [anchor, setAnchor] = useState<'fg' | 'bg'>('bg')
	// 캔버스에 띄울 테스트 객체. 아이콘은 선택할 때마다 랜덤. (초기값은 hydration 안전하게 고정)
	const [obj, setObj] = useState<CanvasObject>('logo')
	const [iconSrc, setIconSrc] = useState(ICON_SRCS[0])
	const selectObj = (v: CanvasObject) => {
		setObj(v)
		if (v === 'icon') setIconSrc(randomIcon())
	}

	const hexOf = (id: string) => flat.find((s) => s.id === id)?.hex
	const fg = hexOf(fgId) ?? '#000000'
	const bg = hexOf(bgId) ?? '#FFFFFF'

	// 중립(white/black)은 tone-in-tone 비참여 → 어느 쪽이든 항상 비활성.
	const neutralIds = flat.filter((s) => metaOf(s.id).tone == null).map((s) => s.id)

	const anchorMeta = metaOf(anchor === 'fg' ? fgId : bgId)
	const fgGroups =
		anchor === 'bg'
			? computeGroups(anchorMeta, true, flat) // 전경이 종속
			: { disabled: neutralIds, recommended: [] as string[] } // 전경이 앵커(자유, 중립만 off)
	const bgGroups =
		anchor === 'fg'
			? computeGroups(anchorMeta, false, flat) // 배경이 종속
			: { disabled: neutralIds, recommended: [] as string[] }

	// 한쪽을 고르면 그쪽이 앵커가 되고, 반대쪽이 무효면 유효한 첫 후보(추천 우선)로 옮긴다.
	const pickFg = (id: string) => {
		setFgId(id)
		setAnchor('fg')
		const g = computeGroups(metaOf(id), false, flat)
		if (g.disabled.includes(bgId)) {
			const next = g.recommended[0] ?? flat.find((s) => !g.disabled.includes(s.id))?.id
			if (next) setBgId(next)
		}
	}
	const pickBg = (id: string) => {
		setBgId(id)
		setAnchor('bg')
		const g = computeGroups(metaOf(id), true, flat)
		if (g.disabled.includes(fgId)) {
			const next = g.recommended[0] ?? flat.find((s) => !g.disabled.includes(s.id))?.id
			if (next) setFgId(next)
		}
	}

	return (
		<div className="w-full">
			{/* 세 영역을 약간 분리(gap). border-radius 없음. */}
			<div className="flex w-full items-stretch gap-3">
				{/* 왼쪽: 전경색 */}
				<div className="w-40 shrink-0">
					<MiniPalette
						rows={rows}
						selectedId={fgId}
						onSelect={pickFg}
						disabledIds={fgGroups.disabled}
						recommendedIds={fgGroups.recommended}
					/>
				</div>
				{/* 가운데: 배경 캔버스 — 좌상단 세그먼트 탭으로 로고/텍스트/아이콘 전환, 전경색으로 그린다 */}
				<div
					className="relative flex flex-1 items-center justify-center overflow-hidden px-6"
					style={{ backgroundColor: bg }}
				>
					{/* 객체 선택 — logo-viewer의 필드 선택 탭과 동일 패턴(각지게). */}
					<div className="absolute top-2 left-2 inline-flex gap-1 border border-border bg-background/90 p-1 backdrop-blur">
						{CANVAS_OBJECTS.map((o) => (
							<button
								key={o.value}
								type="button"
								onClick={() => selectObj(o.value)}
								aria-pressed={obj === o.value}
								className={`px-2.5 py-1 font-body font-medium text-xs transition-colors ${
									obj === o.value
										? 'bg-foreground text-background'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{o.label}
							</button>
						))}
					</div>

					{obj === 'text' && (
						<div className="max-w-[75%] text-center" style={{ color: fg }}>
							<p className="font-bold text-3xl tracking-tight">{wordmark}</p>
							<p className="mt-1 font-body text-sm">
								자연에서 찾은 피부 본연의 힘 · Daily Skincare
							</p>
						</div>
					)}
					{obj === 'logo' && (
						<div
							role="img"
							aria-label="로고"
							className="h-14 w-64"
							style={maskStyle(logoSrc, fg)}
						/>
					)}
					{obj === 'icon' && (
						<div
							role="img"
							aria-label="아이콘"
							className="h-24 w-24"
							style={maskStyle(iconSrc, fg)}
						/>
					)}
				</div>
				{/* 오른쪽: 배경색 */}
				<div className="w-40 shrink-0">
					<MiniPalette
						rows={rows}
						selectedId={bgId}
						onSelect={pickBg}
						disabledIds={bgGroups.disabled}
						recommendedIds={bgGroups.recommended}
					/>
				</div>
			</div>
			<p className="mt-2 font-body font-normal text-muted-foreground text-xs">
				좌상단에서 테스트 객체(로고·텍스트·아이콘)를 바꿔 다양한 환경을 확인 · 한쪽을 고르면
				반대쪽이 Tone in Tone 규칙으로 나뉩니다 · ● 추천 · ╱ 조합 불가
			</p>
		</div>
	)
}

// 데모용 essenherb 행: main에서 Essenherb Red 제거(red 계열에 이미 있음) → (white, black) + 6계열×5.
const mainRow = MAIN.filter((s) => s.id !== 'main-red')
const rows: MiniSwatch[][] = [mainRow, ...MULTI]

export function LogoColorChangerDemo() {
	return (
		<LogoColorChanger
			rows={rows}
			logoSrc="/kit-sample-icons/essenherb-horizontal.svg"
			defaultFgId="red-3"
			defaultBgId="blue-1"
		/>
	)
}
