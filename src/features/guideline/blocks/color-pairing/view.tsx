'use client'

import { Misuse, WarningAltFilled } from '@carbon/icons-react'
import { useState } from 'react'
import { getContrastingForeground } from '@/lib/color'
import type { PairingEntry } from './pairings'

// 미니 팔레트 스와치. id는 색 key(예: 'red-3', 'main-white').
type Swatch = { id: string; hex: string; name?: string }

const CELL_PX = 36

// 미니 팔레트 — 고정 정사각 셀. disabled=금지(misuse 아이콘·선택 불가), warning=주의(경고 아이콘).
function MiniPalette({
	rows,
	selectedId,
	onSelect,
	disabledIds,
	warningIds,
}: {
	rows: Swatch[][]
	selectedId: string | null
	onSelect: (id: string) => void
	disabledIds?: Set<string>
	warningIds?: Set<string>
}) {
	const maxCells = rows.length ? Math.max(...rows.map((r) => r.length)) : 0
	return (
		<div
			className="flex flex-col border border-foreground/10"
			style={{ width: maxCells * CELL_PX }}
		>
			{rows.map((row) => (
				<div key={row.map((s) => s.id).join(':')} className="flex w-full">
					{row.map((sw) => {
						const disabled = disabledIds?.has(sw.id) ?? false
						const warning = !disabled && (warningIds?.has(sw.id) ?? false)
						const selected = selectedId === sw.id
						const contrast = getContrastingForeground(sw.hex)
						return (
							<button
								key={sw.id}
								type="button"
								aria-pressed={selected}
								aria-label={sw.name ?? sw.hex}
								title={sw.name ?? sw.hex}
								disabled={disabled}
								onClick={() => onSelect(sw.id)}
								className={`relative grid flex-1 place-items-center outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
								style={{
									height: CELL_PX,
									backgroundColor: sw.hex,
									boxShadow: selected ? `inset 0 0 0 2px ${contrast}` : undefined,
								}}
							>
								{disabled && (
									<span
										className="pointer-events-none"
										style={{ color: contrast }}
									>
										<Misuse size={20} />
									</span>
								)}
								{warning && (
									<span
										className="pointer-events-none"
										style={{ color: contrast }}
									>
										<WarningAltFilled size={20} />
									</span>
								)}
							</button>
						)
					})}
				</div>
			))}
		</div>
	)
}

const CANVAS_OBJECTS = [
	{ value: 'logo', label: '로고' },
	{ value: 'text', label: '텍스트' },
	{ value: 'icon', label: '아이콘' },
] as const
type CanvasObject = (typeof CANVAS_OBJECTS)[number]['value']

// SVG 실루엣을 color로 재색하는 mask 스타일. size로 SVG 내부 여백을 크롭한다.
const maskStyle = (src: string, color: string, size = 'contain') =>
	({
		backgroundColor: color,
		maskImage: `url(${src})`,
		maskRepeat: 'no-repeat',
		maskPosition: 'center',
		maskSize: size,
		WebkitMaskImage: `url(${src})`,
		WebkitMaskRepeat: 'no-repeat',
		WebkitMaskPosition: 'center',
		WebkitMaskSize: size,
	}) as const

/**
 * 컬러 페어링 뷰어(클라이언트) — 배경색(왼쪽)을 먼저 고르면 전경색(오른쪽)이 병용 테이블로
 * 추천(무표시)/주의(warning)/금지(misuse) 3단계로 나뉜다. 가운데 캔버스에서 로고·텍스트·아이콘으로
 * 조합을 테스트한다. 브랜드 무관: 색·행·매핑·에셋 전부 props(서버가 brand-colors/pairs로 조립).
 */
export function ColorPairingView({
	rows,
	pairs,
	logoSrc,
	iconSrcs,
	wordmark,
	defaultBgId,
	defaultFgId,
}: {
	rows: Swatch[][]
	pairs: Record<string, PairingEntry>
	logoSrc: string
	iconSrcs: string[]
	wordmark: string
	defaultBgId: string
	defaultFgId: string
}) {
	const flat = rows.flat()
	const [bgId, setBgId] = useState<string | null>(defaultBgId)
	const [fgId, setFgId] = useState<string | null>(defaultFgId)
	const [obj, setObj] = useState<CanvasObject>('logo')

	const hexOf = (id: string | null) => (id ? flat.find((s) => s.id === id)?.hex : undefined)
	const fg = hexOf(fgId) ?? '#000000'
	const bg = hexOf(bgId) ?? '#FFFFFF'

	// 배경(Step1): 테이블 키 없는 색은 배경 불가. 전경(Step2): 선택 배경의 병용 목록.
	const bgDisabled = new Set(flat.filter((s) => !(s.id in pairs)).map((s) => s.id))
	const entry = bgId ? pairs[bgId] : undefined
	const compatible = entry ? new Set([...entry.recommended, ...entry.usable]) : null
	const fgDisabled = compatible
		? new Set(flat.filter((s) => !compatible.has(s.id)).map((s) => s.id))
		: new Set<string>()
	const fgWarning = new Set(entry?.usable ?? [])

	const pickBg = (id: string) => {
		if (id === bgId) {
			setBgId(null)
			return
		}
		setBgId(id)
		const e = pairs[id]
		if (e && fgId && !e.recommended.includes(fgId) && !e.usable.includes(fgId)) {
			setFgId(e.recommended[0] ?? e.usable[0] ?? null)
		}
	}
	const pickFg = (id: string) => setFgId((cur) => (cur === id ? null : id))

	return (
		<div className="flex w-full items-stretch gap-3">
			{/* 왼쪽: 배경색(Step1) */}
			<div className="shrink-0">
				<p className="mb-1 font-body font-medium text-muted-foreground text-xs">배경색</p>
				<MiniPalette
					rows={rows}
					selectedId={bgId}
					onSelect={pickBg}
					disabledIds={bgDisabled}
				/>
			</div>
			{/* 가운데: 배경 캔버스 */}
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
							onClick={() => setObj(o.value)}
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
					<div className="max-w-[80%] text-center" style={{ color: fg }}>
						<p className="font-bold text-3xl tracking-tight">{wordmark}</p>
						<p className="mt-2 font-body text-sm leading-relaxed">
							자연에서 찾은 피부 본연의 힘. 혹독한 환경에서도 살아남는 허브의 회복력을
							담아 매일의 루틴을 건강하게. Vegan skincare, rooted in nature.
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
					<div className="grid grid-cols-3 gap-[3px]">
						{iconSrcs.map((src, i) => (
							<div
								key={src}
								role="img"
								aria-label={`아이콘 ${i + 1}`}
								className="size-[88px]"
								style={maskStyle(src, fg, '167%')}
							/>
						))}
					</div>
				)}
			</div>
			{/* 오른쪽: 전경색(Step2) */}
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
