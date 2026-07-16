// 레이아웃 그리드 시각화: columns개의 컬럼 오버레이를 CSS grid로 그려 마진/거터 규격을 보여준다.
// Carbon Tile(카드) 위에 어두운 인셋 캔버스를 얹고, 그 안에 반투명 세로 바로 컬럼을 표현한다.

export function GridSystemDiagram({
	columns,
	gutter,
	margin,
	label,
	accent,
}: {
	columns: number
	gutter?: string
	margin?: string
	label?: string
	// 강조색(브랜드 색). 없으면 토큰 기반 중립색으로 렌더한다.
	accent?: string
}) {
	const specs = [
		{ label: 'Columns', value: String(columns) },
		...(gutter ? [{ label: 'Gutter', value: gutter }] : []),
		...(margin ? [{ label: 'Margin', value: margin }] : []),
	]

	return (
		<div className="rounded-lg bg-background-secondary p-6">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				{label && <h4 className="type-body-emphasized text-foreground">{label}</h4>}
				<dl className="flex flex-wrap gap-2">
					{specs.map((spec) => (
						<div
							key={spec.label}
							className="flex items-baseline gap-1.5 rounded-full bg-fill-muted px-3 py-1"
						>
							<dt className="type-caption-1 text-foreground-muted">{spec.label}</dt>
							<dd className="type-caption-1-emphasized text-foreground tabular-nums">
								{spec.value}
							</dd>
						</div>
					))}
				</dl>
			</div>

			<div
				className="mt-5 grid rounded-md bg-background"
				style={{
					gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
					columnGap: gutter ?? '0.5rem',
					padding: margin ?? '1rem',
				}}
			>
				{Array.from({ length: columns }, (_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 순수 오버레이 바, 재정렬 없음
						key={i}
						className="h-24 rounded-sm bg-fill-hover"
						style={accent ? { backgroundColor: accent, opacity: 0.35 } : undefined}
					/>
				))}
			</div>
		</div>
	)
}

export function GridSystemDiagramDemo() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			<GridSystemDiagram
				label="Desktop · 12 columns"
				columns={12}
				gutter="24px"
				margin="64px"
			/>
			<GridSystemDiagram label="Tablet · 8 columns" columns={8} gutter="16px" margin="32px" />
		</div>
	)
}
