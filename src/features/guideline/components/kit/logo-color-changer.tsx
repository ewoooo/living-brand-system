'use client'

import { useState } from 'react'
import { type PaletteSwatch, PaletteSwatches } from './palette-swatches'

/**
 * 로고 컬러 체인저 — 가운데 로고, 양옆 미니 컬러 팔레트(왼=전경색, 오른=배경색).
 * 전경색을 고르면 함께 쓸 수 있는 배경색만 남기고 제한한다. 선택된 칩을 다시 누르면 선택이 취소된다.
 * 브랜드 무관: 팔레트·조합 규칙·로고 전부 props.
 *
 * @example
 * <LogoColorChanger swatches={[...]} allowedBackgrounds={{ fgId: ['bgId'] }} logo={(c) => dataUri} />
 */
export function LogoColorChanger({
	swatches,
	allowedBackgrounds,
	logo,
}: {
	swatches: PaletteSwatch[]
	/** 전경색 id → 허용 배경색 id 목록. */
	allowedBackgrounds: Record<string, string[]>
	/** 전경색 hex를 받아 로고 SVG data-URI를 돌려주는 함수(색상 치환). */
	logo: (color: string) => string
}) {
	const [fgId, setFgId] = useState<string | null>('green')
	const [bgId, setBgId] = useState<string | null>('white')

	// 재클릭 → 선택 취소, 다른 것 → 변경.
	const toggle = (setter: typeof setFgId) => (id: string) =>
		setter((current) => (current === id ? null : id))

	const allowedBg = fgId ? (allowedBackgrounds[fgId] ?? []) : swatches.map((s) => s.id)
	const disabledBg = swatches.map((s) => s.id).filter((id) => !allowedBg.includes(id))
	const effectiveBgId = bgId && allowedBg.includes(bgId) ? bgId : null

	const fg = swatches.find((s) => s.id === fgId)
	const bg = swatches.find((s) => s.id === effectiveBgId)
	const logoColor = fg?.hex ?? '#ACACAC'

	return (
		<div className="w-full">
			<div className="flex h-72 items-stretch gap-4">
				{/* 왼쪽: 전경색 */}
				<div className="flex w-12 flex-col gap-2">
					<PaletteSwatches
						swatches={swatches}
						variant="mini"
						orientation="vertical"
						selectedId={fgId}
						onSelect={toggle(setFgId)}
					/>
				</div>

				{/* 가운데: 로고 스테이지 */}
				<div
					className={`grid flex-1 place-items-center rounded-lg border border-border transition-colors ${
						bg ? '' : 'bg-fill-muted'
					}`}
					style={bg ? { backgroundColor: bg.hex } : undefined}
				>
					{/* biome-ignore lint/performance/noImgElement: 색상 치환 data-URI라 next/image 미사용. */}
					<img src={logo(logoColor)} alt="로고" className="h-14 w-auto" />
				</div>

				{/* 오른쪽: 배경색(전경색에 따라 제한) */}
				<div className="flex w-12 flex-col gap-2">
					<PaletteSwatches
						swatches={swatches}
						variant="mini"
						orientation="vertical"
						selectedId={effectiveBgId}
						disabledIds={disabledBg}
						onSelect={toggle(setBgId)}
					/>
				</div>
			</div>

			<div className="mt-2 flex justify-between font-body font-normal text-muted-foreground text-xs">
				<span>← 전경색 {fg ? `· ${fg.name}` : '(선택 안 됨)'}</span>
				<span>배경색 {bg ? `· ${bg.name}` : '(선택 안 됨)'} →</span>
			</div>
			<p className="mt-1 font-body font-normal text-muted-foreground text-xs">
				전경색을 고르면 배경색이 제한됩니다. 선택된 색을 다시 누르면 취소됩니다.
			</p>
		</div>
	)
}

// 프로토타입용 mock 팔레트·규칙·로고(브랜드 무관).
const swatches: PaletteSwatch[] = [
	{ id: 'green', name: 'Herb Green', hex: '#1F6F5C' },
	{ id: 'lime', name: 'Lime', hex: '#C7E86B' },
	{ id: 'ink', name: 'Ink', hex: '#171717' },
	{ id: 'white', name: 'White', hex: '#FFFFFF' },
	{ id: 'sand', name: 'Sand', hex: '#E7E2D6' },
]
const allowedBackgrounds: Record<string, string[]> = {
	green: ['white', 'sand', 'lime'],
	lime: ['ink', 'green'],
	ink: ['white', 'sand', 'lime'],
	white: ['ink', 'green'],
	sand: ['ink', 'green'],
}
const wordmark = (color: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56"><text x="120" y="40" font-family="sans-serif" font-size="34" font-weight="800" letter-spacing="-1" fill="${color}" text-anchor="middle">Essenherb</text></svg>`,
	)}`

export function LogoColorChangerDemo() {
	return (
		<LogoColorChanger
			swatches={swatches}
			allowedBackgrounds={allowedBackgrounds}
			logo={wordmark}
		/>
	)
}
