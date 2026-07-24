'use client'

import { getContrastingForeground } from '@/lib/color'

/**
 * 미니 팔레트 — Color Palette와 색·그리드만 공유하고 나머지는 다 걷어낸 순수 color picker.
 * 텍스트·복사·애니메이션 없음. 수직 스택으로 행을 쌓고, 각 행의 칸은 width=fill(행마다 개수만 다름).
 * 클릭 = 선택(라디오). 선택 칸은 대비색 inset ring으로 표시한다.
 *
 * 3그룹 표시(조합 규칙은 상위가 계산해서 id로 넘긴다):
 * - disabledIds: 선택 불가 — 클릭 막고 cursor-not-allowed, 대비색 얇은 사선으로 별도 표시.
 * - recommendedIds: 추천 — 대비색 동그라미로 클릭을 유도.
 * - 그 외: 선택 가능(평범).
 * 브랜드 무관: 색·행 구성은 rows props.
 */
export type MiniSwatch = { id: string; hex: string; name?: string }

export function MiniPalette({
	rows,
	selectedId,
	onSelect,
	disabledIds,
	recommendedIds,
}: {
	/** 행 배열. 각 행의 칸은 균등 폭으로 채운다. 예: [[white, black], red×5, …, gray×5]. */
	rows: MiniSwatch[][]
	selectedId?: string | null
	onSelect?: (id: string) => void
	/** 선택 불가 칸 id. */
	disabledIds?: string[]
	/** 추천 칸 id(동그라미 강조). disabled면 무시된다. */
	recommendedIds?: string[]
}) {
	return (
		<div className="flex w-full flex-col border border-foreground/10">
			{rows.map((row) => (
				<div key={row.map((s) => s.id).join(':')} className="flex w-full">
					{row.map((sw) => {
						const selected = selectedId === sw.id
						const disabled = disabledIds?.includes(sw.id) ?? false
						const recommended = !disabled && (recommendedIds?.includes(sw.id) ?? false)
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
								className={`relative h-7 flex-1 outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
								style={{
									backgroundColor: sw.hex,
									boxShadow: selected ? `inset 0 0 0 2px ${contrast}` : undefined,
								}}
							>
								{/* 선택 불가: 대비색 얇은 사선 */}
								{disabled && (
									<span
										className="pointer-events-none absolute inset-0"
										style={{
											backgroundImage: `linear-gradient(to top right, transparent calc(50% - 0.5px), ${contrast} calc(50% - 0.5px), ${contrast} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
											opacity: 0.6,
										}}
									/>
								)}
								{/* 추천: 대비색 동그라미 */}
								{recommended && (
									<span className="pointer-events-none absolute inset-0 grid place-items-center">
										<span
											className="h-2 w-2 rounded-full"
											style={{ backgroundColor: contrast, opacity: 0.9 }}
										/>
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
