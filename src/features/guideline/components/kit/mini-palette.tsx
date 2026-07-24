'use client'

import { Misuse, WarningAltFilled } from '@carbon/icons-react'
import { getContrastingForeground } from '@/lib/color'

/**
 * 미니 팔레트 — Color Palette와 색·그리드만 공유하고 나머지는 다 걷어낸 순수 color picker.
 * 텍스트·복사·애니메이션 없음. 수직 스택으로 행을 쌓고, 각 행의 칸은 width=fill(행마다 개수만 다름).
 * 클릭 = 선택(라디오). 선택 칸은 대비색 ring으로 표시한다.
 *
 * 칸 상태(조합 규칙은 상위가 계산해 id로 넘긴다). 아이콘은 Carbon, 대비색:
 * - disabledIds: 금지(misuse) — Misuse 아이콘, 선택 불가.
 * - warningIds: 주의(warning, 중간 0.5) — WarningAltFilled 아이콘, 선택 가능.
 * - 그 외: 추천(일반 기본) — 아이콘 없이 색만.
 * 브랜드 무관: 색·행 구성은 rows props.
 */
export type MiniSwatch = { id: string; hex: string; name?: string }

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
	return (
		<div className="flex w-full flex-col border border-foreground/10">
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
								className={`relative grid h-7 flex-1 place-items-center outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
								style={{
									backgroundColor: sw.hex,
									boxShadow: selected ? `inset 0 0 0 2px ${contrast}` : undefined,
								}}
							>
								{disabled && (
									<span
										className="pointer-events-none"
										style={{ color: contrast }}
									>
										<Misuse size={16} />
									</span>
								)}
								{warning && (
									<span
										className="pointer-events-none"
										style={{ color: contrast }}
									>
										<WarningAltFilled size={16} />
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
