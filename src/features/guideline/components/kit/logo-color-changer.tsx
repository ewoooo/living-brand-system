'use client'

import { useState } from 'react'
import { MAIN, MULTI } from './color-palette'
import { MiniPalette, type MiniSwatch } from './mini-palette'

/**
 * 로고 컬러 체인저 — 왼쪽 미니 팔레트(전경색) · 가운데 스테이지(배경 + 로고 텍스트) · 오른쪽 미니 팔레트(배경색)를
 * 빈틈없이 붙인 조합 프리뷰. 양쪽 모두 자유 선택이며, 고른 색이 즉시 텍스트색·배경색에 반영된다.
 * (BG 톤→FG 톤 페어링 제약은 후속 단계에서 얹는다 — 지금은 모두 선택 가능.)
 * 브랜드 무관: 색·행 구성·워드마크는 props.
 *
 * @example
 * <LogoColorChanger rows={[[white, black], red×5, …]} defaultFgId="red-3" defaultBgId="main-white" />
 */
export function LogoColorChanger({
	rows,
	wordmark = 'Essenherb',
	defaultFgId,
	defaultBgId,
}: {
	rows: MiniSwatch[][]
	/** 스테이지 가운데에 그릴 로고 텍스트. */
	wordmark?: string
	defaultFgId?: string
	defaultBgId?: string
}) {
	const flat = rows.flat()
	const [fgId, setFgId] = useState(defaultFgId ?? flat[0]?.id)
	const [bgId, setBgId] = useState(defaultBgId ?? flat[flat.length - 1]?.id)
	const hexOf = (id?: string) => flat.find((s) => s.id === id)?.hex
	const fg = hexOf(fgId) ?? '#000000'
	const bg = hexOf(bgId) ?? '#FFFFFF'

	return (
		<div className="flex w-full items-stretch">
			{/* 왼쪽: 전경색 */}
			<div className="w-40 shrink-0">
				<MiniPalette rows={rows} selectedId={fgId} onSelect={setFgId} />
			</div>
			{/* 가운데: 배경 + 로고 텍스트 */}
			<div
				className="flex flex-1 items-center justify-center px-6"
				style={{ backgroundColor: bg }}
			>
				<span className="font-bold text-3xl tracking-tight" style={{ color: fg }}>
					{wordmark}
				</span>
			</div>
			{/* 오른쪽: 배경색 */}
			<div className="w-40 shrink-0">
				<MiniPalette rows={rows} selectedId={bgId} onSelect={setBgId} />
			</div>
		</div>
	)
}

// 데모용 essenherb 행: main에서 Essenherb Red 제거(red 계열에 이미 있음) → (white, black) + 6계열×5.
const mainRow = MAIN.filter((s) => s.id !== 'main-red')
const rows: MiniSwatch[][] = [mainRow, ...MULTI]

export function LogoColorChangerDemo() {
	return <LogoColorChanger rows={rows} defaultFgId="red-3" defaultBgId="main-white" />
}
