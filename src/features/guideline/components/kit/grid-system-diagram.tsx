/**
 * 레이아웃 그리드 규격 시각화 — columns개의 컬럼 오버레이를 CSS grid로 그려 마진/거터를 보여준다.
 * 카드 위에 인셋 캔버스를 얹고 그 안에 반투명 세로 바로 컬럼을 표현. 반응형 규격을 나란히 보여줄 땐 2개 이상 배치.
 *
 * @example 데스크톱 12컬럼 규격
 * <GridSystemDiagram label="Desktop · 12 columns" columns={12} gutter="24px" margin="64px" />
 *
 * @example 브랜드 강조색으로 컬럼 강조
 * <GridSystemDiagram label="Tablet · 8 columns" columns={8} gutter="16px" margin="32px" accent="#00A19C" />
 */
export function GridSystemDiagram({
	columns,
	gutter,
	margin,
	label,
	accent,
}: {
	/** 오버레이할 컬럼 수. 세로 바 개수이자 grid 컬럼 개수. */
	columns: number
	/** 거터(컬럼 사이 간격) 규격. CSS 길이 문자열. 생략 시 '0.5rem'. Gutter 칩으로도 표기된다. */
	gutter?: string
	/** 마진(캔버스 안쪽 여백) 규격. CSS 길이 문자열. 생략 시 '1rem'. Margin 칩으로도 표기된다. */
	margin?: string
	/** 좌측 상단 제목(선택). 예: 'Desktop · 12 columns'. */
	label?: string
	/** 컬럼 강조색(브랜드 색). 없으면 토큰 기반 중립색으로 렌더한다. */
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
