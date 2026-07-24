'use client'

import { useState } from 'react'
import { getContrastingForeground } from '@/lib/color'
import { MAIN, MULTI } from './color-palette'

/**
 * 미니 팔레트 — Color Palette와 색·그리드만 공유하고 나머지는 다 걷어낸 순수 color picker.
 * 텍스트·복사·애니메이션 없음. 수직 스택으로 행을 쌓고, 각 행의 칸은 width=fill(행마다 개수만 다름).
 * 클릭 = 선택(라디오). 선택 칸은 대비색 inset ring으로만 표시한다.
 * 브랜드 무관: 색·행 구성은 rows props.
 *
 * @example
 * <MiniPalette rows={[[white, black], red1to5, ...]} selectedId={id} onSelect={setId} />
 */
export type MiniSwatch = { id: string; hex: string; name?: string }

export function MiniPalette({
	rows,
	selectedId,
	onSelect,
}: {
	/** 행 배열. 각 행의 칸은 균등 폭으로 채운다. 예: [[white, black], red×5, …, gray×5]. */
	rows: MiniSwatch[][]
	selectedId?: string | null
	onSelect?: (id: string) => void
}) {
	return (
		<div className="flex w-full flex-col">
			{rows.map((row) => (
				<div key={row.map((s) => s.id).join(':')} className="flex w-full">
					{row.map((sw) => {
						const selected = selectedId === sw.id
						return (
							<button
								key={sw.id}
								type="button"
								aria-pressed={selected}
								aria-label={sw.name ?? sw.hex}
								title={sw.name ?? sw.hex}
								onClick={() => onSelect?.(sw.id)}
								className="h-7 flex-1 cursor-pointer outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
								style={{
									backgroundColor: sw.hex,
									boxShadow: selected
										? `inset 0 0 0 2px ${getContrastingForeground(sw.hex)}`
										: undefined,
								}}
							/>
						)
					})}
				</div>
			))}
		</div>
	)
}

// 데모용 essenherb 행 구성: main에서 Essenherb Red 제거(red 계열에 이미 있음) → (white, black) + 6계열×5.
const mainRow = MAIN.filter((s) => s.id !== 'main-red')
const rows: MiniSwatch[][] = [mainRow, ...MULTI]

export function MiniPaletteDemo() {
	const [fgId, setFgId] = useState<string | null>(null)
	const [bgId, setBgId] = useState<string | null>(null)
	return (
		<div className="flex gap-6">
			<div className="w-40">
				<p className="mb-1 font-body font-normal text-muted-foreground text-xs">
					← 전경색 (foreground)
				</p>
				<MiniPalette rows={rows} selectedId={fgId} onSelect={setFgId} />
			</div>
			<div className="w-40">
				<p className="mb-1 font-body font-normal text-muted-foreground text-xs">
					배경색 (background) →
				</p>
				<MiniPalette rows={rows} selectedId={bgId} onSelect={setBgId} />
			</div>
		</div>
	)
}
