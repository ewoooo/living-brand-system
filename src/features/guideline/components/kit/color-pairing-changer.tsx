'use client'

import { useState } from 'react'
import { MAIN, MULTI } from './color-palette'
import { MiniPalette, type MiniSwatch } from './mini-palette'
import { monoTone, type PairingSystemData, toneInTone, toneOnTone } from './pairing-systems'

/**
 * 컬러 페어링 체인저 — 왼쪽 미니 팔레트(전경색) · 가운데 스테이지(배경 + 객체) · 오른쪽 미니 팔레트(배경색).
 * 배경색을 먼저 고르고(Step1), 전경색은 전처리 테이블로 추천(일반)/warning/misuse 3단계 표시(Step2).
 * 시스템(Tone in/on/Mono)은 props로 주입 — 컴포넌트는 시스템별 분기가 없다(pairing-systems.ts가 테이블 소유).
 * 브랜드 무관: 색·행 구성·워드마크·테이블 전부 props.
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
	/** 페어링 시스템(전처리된 병용 테이블). pairing-systems.ts 참고. */
	system: PairingSystemData
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
	const hexOf = (id: string | null) => (id ? byId(id)?.hex : undefined)
	const fg = hexOf(fgId) ?? '#000000'
	const bg = hexOf(bgId) ?? '#FFFFFF'

	// 전처리 테이블 조회. 배경(Step1): 키 없는 색은 배경 불가(misuse). 전경(Step2): 선택 배경 기준 등급.
	const bgDisabled = flat.filter((s) => !(s.id in system.pairs)).map((s) => s.id)
	const entry = bgId ? system.pairs[bgId] : undefined
	// 전경: recommended·usable 어디에도 없으면 금지(misuse), usable은 주의(warning), recommended는 일반.
	const fgDisabled = entry
		? flat
				.filter((s) => !entry.recommended.includes(s.id) && !entry.usable.includes(s.id))
				.map((s) => s.id)
		: []
	const fgWarning = entry ? entry.usable : []

	// 배경(Step1)을 바꾸면 전경 후보 갱신. 기존 전경이 병용 불가면 첫 병용 가능 색(추천 우선)으로 이동.
	// 같은 색을 다시 누르면 선택 취소.
	const pickBg = (id: string) => {
		if (id === bgId) {
			setBgId(null)
			return
		}
		setBgId(id)
		const e = system.pairs[id]
		if (e && fgId && !e.recommended.includes(fgId) && !e.usable.includes(fgId)) {
			setFgId(e.recommended[0] ?? e.usable[0] ?? null)
		}
	}
	const pickFg = (id: string) => {
		setFgId((cur) => (cur === id ? null : id))
	}

	return (
		<div className="flex w-full items-stretch gap-3">
			{/* 왼쪽: 배경색(Step1) — 팔레트가 고정 크기라 폭은 콘텐츠에 맞춘다 */}
			<div className="shrink-0">
				<p className="mb-1 font-body font-medium text-muted-foreground text-xs">배경색</p>
				<MiniPalette
					rows={rows}
					selectedId={bgId}
					onSelect={pickBg}
					disabledIds={bgDisabled}
				/>
			</div>
			{/* 가운데: 배경 캔버스 — 좌상단 탭으로 로고/텍스트/아이콘 전환, 전경색으로 그린다 */}
			<div
				className="relative flex flex-1 items-center justify-center overflow-hidden px-6"
				style={{ backgroundColor: bg }}
			>
				{/* 객체 선택 탭 — 캔버스 색과 무관하게 판독되도록 흰 배경 고정. */}
				<div className="absolute top-2 left-2 inline-flex flex-wrap gap-1 self-start rounded-full border border-neutral-200 bg-white p-1">
					{CANVAS_OBJECTS.map((o) => (
						<button
							key={o.value}
							type="button"
							onClick={() => selectObj(o.value)}
							aria-pressed={obj === o.value}
							className={`rounded-full px-4 py-1.5 font-body font-medium text-sm transition-colors ${
								obj === o.value
									? 'bg-neutral-900 text-white'
									: 'text-neutral-500 hover:text-neutral-900'
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
			{/* 오른쪽: 전경색(Step2, 배경에 종속) */}
			<div className="shrink-0">
				<p className="mb-1 font-body font-medium text-muted-foreground text-xs">전경색</p>
				<MiniPalette
					rows={rows}
					selectedId={fgId}
					onSelect={pickFg}
					disabledIds={fgDisabled}
					warningIds={fgWarning}
				/>
			</div>
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
