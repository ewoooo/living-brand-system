'use client'

import { getContrastingForeground } from '@/lib/color'

/**
 * 미니 팔레트 — Color Palette와 색·그리드만 공유하고 나머지는 다 걷어낸 순수 color picker.
 * 텍스트·복사·애니메이션 없음. 수직 스택으로 행을 쌓고, 각 행의 칸은 width=fill(행마다 개수만 다름).
 * 클릭 = 선택(라디오). 선택 칸은 대비색 ring으로 표시한다.
 *
 * 칸 상태(조합 규칙은 상위가 계산해 id로 넘긴다):
 * - hiddenIds: 병용 불가 — 사각형을 숨긴다(빈 슬롯, 폭은 유지해 그리드 정렬 보존).
 * - circleIds: 사용 가능하나 비추천('그냥') — 꽉 찬 사각형 대신 지름 min(폭,높이)·0.8 원으로.
 * - 그 외: 추천(기본) — 색이 꽉 찬 사각형.
 * 브랜드 무관: 색·행 구성은 rows props.
 */
export type MiniSwatch = { id: string; hex: string; name?: string }

export function MiniPalette({
	rows,
	selectedId,
	onSelect,
	hiddenIds,
	circleIds,
}: {
	rows: MiniSwatch[][]
	selectedId?: string | null
	onSelect?: (id: string) => void
	/** 병용 불가 — 사각형 숨김(빈 슬롯). */
	hiddenIds?: string[]
	/** 사용 가능/비추천 — 원으로 표시. */
	circleIds?: string[]
}) {
	return (
		<div className="flex w-full flex-col border border-foreground/10">
			{rows.map((row) => (
				<div key={row.map((s) => s.id).join(':')} className="flex w-full">
					{row.map((sw) => {
						// 병용 불가: 빈 슬롯(폭 유지, 클릭 불가).
						if (hiddenIds?.includes(sw.id)) {
							return <div key={sw.id} className="h-7 flex-1" />
						}
						const circle = circleIds?.includes(sw.id) ?? false
						const selected = selectedId === sw.id
						const contrast = getContrastingForeground(sw.hex)
						return (
							<button
								key={sw.id}
								type="button"
								aria-pressed={selected}
								aria-label={sw.name ?? sw.hex}
								title={sw.name ?? sw.hex}
								onClick={() => onSelect?.(sw.id)}
								className="relative grid h-7 flex-1 cursor-pointer place-items-center outline-none [container-type:size] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
								style={
									circle
										? undefined
										: {
												backgroundColor: sw.hex,
												boxShadow: selected
													? `inset 0 0 0 2px ${contrast}`
													: undefined,
											}
								}
							>
								{circle && (
									// 지름 = min(폭,높이)·0.8 (cqmin). 사각형 슬롯 중앙에 원.
									<span
										className="rounded-full"
										style={{
											width: '80cqmin',
											height: '80cqmin',
											backgroundColor: sw.hex,
											boxShadow: selected
												? `0 0 0 2px ${contrast}`
												: undefined,
										}}
									/>
								)}
							</button>
						)
					})}
				</div>
			))}
		</div>
	)
}
