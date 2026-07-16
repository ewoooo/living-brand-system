// Carbon type-scale 이식: 각 타입 토큰을 실제 크기 샘플 + 스펙(size/line-height/weight)으로 나열.
// 프레젠테이션 전용 — 나중에 Payload 블록 데이터를 이 props로 매핑한다.
export type TypeScaleItem = {
	name: string
	sample: string
	sizePx: number
	lineHeightPx: number
	weight: number
}

export function TypeScale({ items }: { items: TypeScaleItem[] }) {
	return (
		<dl className="flex flex-col">
			{items.map((item) => (
				<div
					key={item.name}
					className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:justify-between md:gap-6"
				>
					<dd
						className="min-w-0 truncate text-foreground"
						style={{
							fontSize: item.sizePx,
							lineHeight: `${item.lineHeightPx}px`,
							fontWeight: item.weight,
						}}
					>
						{item.sample}
					</dd>
					<dt className="type-caption-1 shrink-0 text-foreground-muted tabular-nums md:text-right">
						{item.name} · {item.sizePx}/{item.lineHeightPx} · {item.weight}
					</dt>
				</div>
			))}
		</dl>
	)
}
