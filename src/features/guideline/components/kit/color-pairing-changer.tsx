'use client'

import { useState } from 'react'
import { MAIN, MULTI } from './color-palette'
import { MiniPalette, type MiniSwatch } from './mini-palette'
import {
	enrichPairing,
	monoTone,
	type PairingSystem,
	toneInTone,
	toneOnTone,
} from './pairing-systems'

/**
 * 컬러 페어링 체인저 — 왼쪽 미니 팔레트(전경색) · 가운데 스테이지(배경 + 객체) · 오른쪽 미니 팔레트(배경색).
 * 배경색을 먼저 자유 선택하고(Step1), 전경색은 system 규칙으로 3그룹(선택불가/가능/추천)으로 나뉜다(Step2).
 * 시스템(Tone in/on/Mono)은 props로 주입 — 컴포넌트는 시스템별 분기가 없다(pairing-systems.ts가 규칙 소유).
 * 브랜드 무관: 색·행 구성·워드마크·규칙 전부 props.
 */

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

export function ColorPairingChanger({
	rows,
	system,
	logoSrc,
	wordmark = 'Essenherb',
	defaultBgId,
	defaultFgId,
}: {
	rows: MiniSwatch[][]
	/** 페어링 규칙(Tone in/on/Mono). pairing-systems.ts 참고. */
	system: PairingSystem
	/** 로고 객체로 그릴 SVG 실루엣 경로(단색, mask로 재색). */
	logoSrc: string
	/** 텍스트 객체로 그릴 문구. */
	wordmark?: string
	defaultBgId: string
	defaultFgId: string
}) {
	const flat = rows.flat()
	const [bgId, setBgId] = useState<string | null>(defaultBgId)
	const [fgId, setFgId] = useState<string | null>(defaultFgId)
	const [obj, setObj] = useState<CanvasObject>('logo')
	const [iconSrc, setIconSrc] = useState(ICON_SRCS[0])
	const selectObj = (v: CanvasObject) => {
		setObj(v)
		if (v === 'icon') setIconSrc(randomIcon())
	}

	const byId = (id: string) => flat.find((s) => s.id === id)
	const swatch = (id: string) => enrichPairing(byId(id) ?? { id, hex: '#000000' })
	const hexOf = (id: string | null) => (id ? byId(id)?.hex : undefined)
	const fg = hexOf(fgId) ?? '#000000'
	const bg = hexOf(bgId) ?? '#FFFFFF'

	// 배경(Step1): system.bgEligible 아닌 색은 비활성. 배경은 자유 선택이라 추천 없음.
	const bgDisabled = flat.filter((s) => !system.bgEligible(enrichPairing(s))).map((s) => s.id)

	// 전경(Step2): 선택된 배경 기준으로 등급 계산.
	const fgDisabled: string[] = []
	const fgRecommended: string[] = []
	for (const s of flat) {
		const grade = bgId ? system.classify(swatch(bgId), enrichPairing(s)) : 'allowed'
		if (grade === 'forbidden') fgDisabled.push(s.id)
		else if (grade === 'recommended') fgRecommended.push(s.id)
	}

	// 배경(Step1)을 바꾸면 전경 후보 갱신. 기존 전경이 무효면 유효한 첫 후보(추천 우선)로 이동.
	// 같은 색을 다시 누르면 선택 취소.
	const pickBg = (id: string) => {
		if (id === bgId) {
			setBgId(null)
			return
		}
		setBgId(id)
		const bgSw = swatch(id)
		if (fgId && system.classify(bgSw, swatch(fgId)) === 'forbidden') {
			const rec = flat.find((s) => system.classify(bgSw, enrichPairing(s)) === 'recommended')
			const ok = flat.find((s) => system.classify(bgSw, enrichPairing(s)) !== 'forbidden')
			const next = (rec ?? ok)?.id
			if (next) setFgId(next)
		}
	}
	const pickFg = (id: string) => {
		setFgId((cur) => (cur === id ? null : id))
	}

	return (
		<div className="w-full">
			{/* 세 영역을 약간 분리(gap). border-radius 없음. */}
			<div className="flex w-full items-stretch gap-3">
				{/* 왼쪽: 전경색(Step2, 배경에 종속) */}
				<div className="w-40 shrink-0">
					<MiniPalette
						rows={rows}
						selectedId={fgId}
						onSelect={pickFg}
						disabledIds={fgDisabled}
						recommendedIds={fgRecommended}
					/>
				</div>
				{/* 가운데: 배경 캔버스 — 좌상단 탭으로 로고/텍스트/아이콘 전환, 전경색으로 그린다 */}
				<div
					className="relative flex flex-1 items-center justify-center overflow-hidden px-6"
					style={{ backgroundColor: bg }}
				>
					{/* 객체 선택 — logo-viewer의 필드 선택 탭 스타일(pill). */}
					<div className="absolute top-2 left-2 inline-flex flex-wrap gap-1 self-start rounded-full border border-border bg-fill-muted p-1">
						{CANVAS_OBJECTS.map((o) => (
							<button
								key={o.value}
								type="button"
								onClick={() => selectObj(o.value)}
								aria-pressed={obj === o.value}
								className={`rounded-full px-4 py-1.5 font-body font-medium text-sm transition-colors ${
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
				{/* 오른쪽: 배경색(Step1, 자유) */}
				<div className="w-40 shrink-0">
					<MiniPalette
						rows={rows}
						selectedId={bgId}
						onSelect={pickBg}
						disabledIds={bgDisabled}
					/>
				</div>
			</div>
			<p className="mt-2 font-body font-normal text-muted-foreground text-xs">
				<span className="font-medium text-foreground">{system.label}</span> —{' '}
				{system.description} · ① 배경색(오른쪽) → ② 전경색(왼쪽, ★ 추천 · ⃠ 선택 불가) ·
				선택된 색 다시 누르면 취소
			</p>
		</div>
	)
}

// 데모용 essenherb 행: main에서 Essenherb Red 제거(red 계열에 이미 있음) → (white, black) + 6계열×5.
const mainRow = MAIN.filter((s) => s.id !== 'main-red')
const rows: MiniSwatch[][] = [mainRow, ...MULTI]
const LOGO = '/kit-sample-icons/essenherb-horizontal.svg'

export function ColorPairingToneInToneDemo() {
	return (
		<ColorPairingChanger
			rows={rows}
			system={toneInTone}
			logoSrc={LOGO}
			defaultBgId="blue-1"
			defaultFgId="red-3"
		/>
	)
}

export function ColorPairingToneOnToneDemo() {
	return (
		<ColorPairingChanger
			rows={rows}
			system={toneOnTone}
			logoSrc={LOGO}
			defaultBgId="blue-1"
			defaultFgId="blue-4"
		/>
	)
}

export function ColorPairingMonoToneDemo() {
	return (
		<ColorPairingChanger
			rows={rows}
			system={monoTone}
			logoSrc={LOGO}
			defaultBgId="blue-4"
			defaultFgId="main-white"
		/>
	)
}
