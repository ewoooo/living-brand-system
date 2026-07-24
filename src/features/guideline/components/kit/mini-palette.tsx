'use client'

import { Misuse, WarningAltFilled } from '@carbon/icons-react'
import { getContrastingForeground } from '@/lib/color'

/**
 * 미니 팔레트 — Color Palette와 색·그리드만 공유하고 나머지는 다 걷어낸 순수 color picker.
 * 항상 부분 요소로 쓰이므로 크기 고정: 각 셀은 CELL_PX 정사각(아이콘이 정방형이라). 팔레트 폭은
 * 최장 행(계열 5칸) 기준 = 셀수×CELL_PX로 고정 → 계열 셀은 정사각, main 행(white/black 2칸)은 fill(50%).
 * 클릭 = 선택(라디오). 선택 칸은 대비색 ring. 텍스트·복사·애니메이션 없음.
 *
 * 칸 상태(조합 규칙은 상위가 id로 넘긴다). 아이콘은 Carbon, 대비색:
 * - disabledIds: 금지(misuse) — Misuse 아이콘, 선택 불가.
 * - warningIds: 주의(warning) — WarningAltFilled 아이콘, 선택 가능.
 * - 그 외: 추천(일반 기본) — 아이콘 없이 색만.
 * 브랜드 무관: 색·행 구성은 rows props.
 */
export type MiniSwatch = { id: string; hex: string; name?: string }

// 각 셀 고정 크기(px). 정사각형이 되도록 팔레트 폭도 이 값 기준으로 고정한다.
const CELL_PX = 36

export function MiniPalette({
	rows,
	selectedId,
	onSelect,
	disabledIds,
	warningIds,
}: {
	rows: MiniSwatch[][]
	selectedId?: string | null
	onSelect?: (id: string) => void
	/** 금지(misuse) — 선택 불가 + Misuse 아이콘. */
	disabledIds?: string[]
	/** 주의(warning) — 선택 가능 + Warning 아이콘. */
	warningIds?: string[]
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
						const disabled = disabledIds?.includes(sw.id) ?? false
						const warning = !disabled && (warningIds?.includes(sw.id) ?? false)
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
								onClick={() => onSelect?.(sw.id)}
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
