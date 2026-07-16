// 규정/주의 콜아웃: 지켜야 할 규칙을 판정별(must/recommended/dont)로 강조하는 박스.
// 카본 매핑: Notification/Inline 계열 — Tile(bg-background-secondary) 위 좌측 상태 보더 + 아이콘 배지.
const kindStyle = {
	must: {
		symbol: '✓',
		label: '반드시',
		tint: 'bg-success/10',
		badge: 'bg-success text-success-foreground',
	},
	recommended: {
		symbol: '△',
		label: '권장',
		tint: 'bg-warning/10',
		badge: 'bg-warning text-warning-foreground',
	},
	dont: {
		symbol: '✕',
		label: '금지',
		tint: 'bg-destructive/10',
		badge: 'bg-destructive text-destructive-foreground',
	},
} as const

export type RuleCalloutKind = keyof typeof kindStyle

export function RuleCallout({
	kind,
	title,
	items,
}: {
	kind: RuleCalloutKind
	title?: string
	items: string[]
}) {
	const style = kindStyle[kind]
	return (
		<div className={`rounded-lg ${style.tint} p-6`}>
			<div className="flex items-center gap-3">
				<span
					aria-hidden
					className={`type-caption-1-emphasized grid size-6 shrink-0 place-items-center rounded-full ${style.badge}`}
				>
					{style.symbol}
				</span>
				<h4 className="type-body-emphasized text-foreground">{title ?? style.label}</h4>
			</div>
			<ul className="mt-4 flex flex-col gap-2">
				{items.map((item) => (
					<li key={item} className="type-callout flex gap-2 text-foreground-muted">
						<span aria-hidden className="select-none text-foreground-muted">
							–
						</span>
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

export function RuleCalloutDemo() {
	return (
		<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
			<RuleCallout
				kind="must"
				title="반드시 지킬 것"
				items={[
					'브랜드 시그니처(Essenherb Red #EA5343)는 지정된 원색 그대로 사용한다.',
					'로고 주위 최소 여백(clear space)을 심볼 높이 이상 확보한다.',
					'국문 본문은 지정 서체 Pretendard를 사용한다.',
				]}
			/>
			<RuleCallout
				kind="recommended"
				title="권장"
				items={[
					'사진 위에는 가독성을 위해 반전(화이트) 로고 사용을 권장한다.',
					'키 비주얼에는 시그니처 서체 Essenflux를 제한적으로 활용한다.',
				]}
			/>
			<RuleCallout
				kind="dont"
				title="하지 말 것"
				items={[
					'브랜드 시그니처는 2개 이상 중복/조합해 사용하지 않는다.',
					'로고 색상을 임의로 변경하거나 그라디언트를 적용하지 않는다.',
					'저대비 배경 위에 로고를 얹지 않는다.',
				]}
			/>
		</div>
	)
}
