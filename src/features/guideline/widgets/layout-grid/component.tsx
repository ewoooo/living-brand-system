// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/layout-grid) 통째 삭제.
//
// 위젯: 레이아웃 그리드 규격을 정적으로 시각화(순수 함수, 데이터 조회 없음).
// author 인스턴스(accent 관계·variants)에 의존하지 않고 기본 규격으로 자족 렌더.
// 프레임/텍스트(GuidelineBlockFrame 등)는 컨테이너 Block이 소유 — 위젯은 시각만.
// 원본 blocks/layout-grid에 별도 view 컴포넌트가 없어 GridDiagram을 인라인 재현.

// author config 대체: 기본 규격. accent는 브랜드 종속이라 생략(중립 채움).
const DEFAULT_VARIANTS = [
	{ id: 'desktop', label: 'Desktop', columns: 12, gutter: '24px', margin: '64px' },
	{ id: 'mobile', label: 'Mobile', columns: 4, gutter: '16px', margin: '24px' },
]

export function LayoutGridWidget() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{DEFAULT_VARIANTS.map((variant) => (
				<GridDiagram key={variant.id} variant={variant} />
			))}
		</div>
	)
}

export default LayoutGridWidget

type Variant = { label: string; columns: number; gutter: string; margin: string }

function GridDiagram({ variant }: { variant: Variant }) {
	const specs = [
		{ label: 'Columns', value: String(variant.columns) },
		{ label: 'Gutter', value: variant.gutter },
		{ label: 'Margin', value: variant.margin },
	]

	return (
		<div className="rounded-lg bg-background-secondary p-6">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h4 className="font-body text-base font-semibold text-foreground">
					{variant.label}
				</h4>
				<dl className="flex flex-wrap gap-2">
					{specs.map((spec) => (
						<div
							key={spec.label}
							className="flex items-baseline gap-1.5 rounded-full bg-fill-muted px-3 py-1"
						>
							<dt className="font-body text-xs font-normal text-muted-foreground">
								{spec.label}
							</dt>
							<dd className="font-body text-xs font-medium text-foreground tabular-nums">
								{spec.value}
							</dd>
						</div>
					))}
				</dl>
			</div>

			<div
				className="mt-5 grid rounded-md bg-background"
				style={{
					gridTemplateColumns: `repeat(${variant.columns}, minmax(0, 1fr))`,
					columnGap: variant.gutter,
					padding: variant.margin,
				}}
			>
				{Array.from({ length: variant.columns }, (_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 순수 오버레이 바, 재정렬 없음
						key={i}
						className="h-24 rounded-sm bg-fill-hover"
					/>
				))}
			</div>
		</div>
	)
}
