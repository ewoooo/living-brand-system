'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

/**
 * 컬러 조합 피커 — 전경색을 고르면 그와 함께 쓸 수 있는 배경색만 활성화하고 나머지는 비활성 처리한다.
 * 승인된 배색 조합을 규칙(allowed 맵)으로 강제하는 프로토타입. 프리뷰 타일로 실제 대비를 즉시 확인.
 * 브랜드 무관: 팔레트·규칙 전부 props.
 *
 * @example
 * <PaletteCombinationPicker colors={[{ id, name, hex }]} allowed={{ fgId: ['bgId'] }} />
 */
export type PaletteSwatch = { id: string; name: string; hex: string }

export function PaletteCombinationPicker({
	colors,
	allowed,
	/** 프리뷰에 올릴 전경 샘플 문구. 기본 'Aa'. */
	sampleLabel = 'Aa',
}: {
	colors: PaletteSwatch[]
	/** 전경색 id → 허용 배경색 id 목록. */
	allowed: Record<string, string[]>
	sampleLabel?: string
}) {
	const [fgId, setFgId] = useState(colors[0]?.id)
	const [bgId, setBgId] = useState(allowed[colors[0]?.id ?? '']?.[0])
	const allowedBg = allowed[fgId ?? ''] ?? []
	const effectiveBgId = allowedBg.includes(bgId ?? '') ? bgId : allowedBg[0]

	const fg = colors.find((c) => c.id === fgId)
	const bg = colors.find((c) => c.id === effectiveBgId)

	function selectFg(id: string) {
		setFgId(id)
		setBgId((allowed[id] ?? [])[0])
	}

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<div className="flex flex-col gap-5">
				<Row label="전경색 (선택)">
					<div className="flex flex-wrap gap-2">
						{colors.map((c) => (
							<Swatch
								key={c.id}
								color={c}
								selected={c.id === fgId}
								onClick={() => selectFg(c.id)}
							/>
						))}
					</div>
				</Row>
				<Row label="사용 가능한 배경색">
					<div className="flex flex-wrap gap-2">
						{colors.map((c) => {
							const ok = allowedBg.includes(c.id)
							return (
								<Swatch
									key={c.id}
									color={c}
									selected={c.id === effectiveBgId}
									disabled={!ok}
									onClick={ok ? () => setBgId(c.id) : undefined}
								/>
							)
						})}
					</div>
					<p className="mt-2 font-body font-normal text-muted-foreground text-xs">
						흐리게 표시된 색은 현재 전경색과 함께 쓸 수 없습니다.
					</p>
				</Row>
			</div>

			{/* 프리뷰 */}
			<figure
				className="m-0 grid min-h-56 place-items-center rounded-lg border border-border"
				style={{ backgroundColor: bg?.hex }}
			>
				<span className="font-body font-bold text-6xl" style={{ color: fg?.hex }}>
					{sampleLabel}
				</span>
				<figcaption
					className="mt-3 font-body font-normal text-xs"
					style={{ color: fg?.hex }}
				>
					{fg?.name} on {bg?.name}
				</figcaption>
			</figure>
		</div>
	)
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<p className="mb-2 font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</p>
			{children}
		</div>
	)
}

function Swatch({
	color,
	selected,
	disabled,
	onClick,
}: {
	color: PaletteSwatch
	selected?: boolean
	disabled?: boolean
	onClick?: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-pressed={selected}
			title={`${color.name} · ${color.hex}`}
			className={`h-10 w-10 rounded-md border transition-all ${
				selected
					? 'border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background'
					: 'border-border'
			} ${disabled ? 'cursor-not-allowed opacity-25' : ''}`}
			style={{ backgroundColor: color.hex }}
		/>
	)
}

// 프로토타입용 mock 팔레트(essenherb풍, 브랜드 무관 데이터).
const green = { id: 'green', name: 'Herb Green', hex: '#1f6f5c' }
const lime = { id: 'lime', name: 'Lime', hex: '#c7e86b' }
const ink = { id: 'ink', name: 'Ink', hex: '#171717' }
const white = { id: 'white', name: 'White', hex: '#ffffff' }
const sand = { id: 'sand', name: 'Sand', hex: '#e7e2d6' }

export function PaletteCombinationPickerDemo() {
	return (
		<PaletteCombinationPicker
			colors={[green, lime, ink, white, sand]}
			allowed={{
				green: ['white', 'sand', 'lime'],
				lime: ['ink', 'green'],
				ink: ['white', 'sand', 'lime'],
				white: ['ink', 'green'],
				sand: ['ink', 'green'],
			}}
			sampleLabel="Aa"
		/>
	)
}
