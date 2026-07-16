// Carbon type-scale 이식: 각 타입 토큰을 실제 크기 샘플 + 스펙(size/line-height/weight)으로 나열.
// 프레젠테이션 전용 — 나중에 Payload 블록 데이터를 이 props로 매핑한다.
export type TypeScaleItem = {
	/** 타입 토큰 이름 — 스펙 줄에 그대로 표기(예: 'Heading 01'). */
	name: string
	/** 실제 크기로 렌더링할 미리보기 문구. */
	sample: string
	/** 폰트 크기(px) — sample과 스펙 줄에 함께 적용. */
	sizePx: number
	/** 줄 높이(px). */
	lineHeightPx: number
	/** 폰트 굵기(숫자, 예: 400·700). */
	weight: number
}

/**
 * 타입 스케일 표 — 타입 토큰별 실제 크기 샘플과 스펙(size/line-height/weight)을 세로로 나열.
 * 타이포그래피 규칙 페이지에 그대로 드롭인. 각 항목은 왼쪽 샘플 + 오른쪽 스펙 줄로 렌더링.
 *
 * @example 본문·제목 토큰 나열
 * <TypeScale
 *   items={[
 *     { name: 'Body 01', sample: '다람쥐 헌 쳇바퀴에 타고파', sizePx: 16, lineHeightPx: 24, weight: 400 },
 *     { name: 'Heading 01', sample: '다람쥐 헌 쳇바퀴에 타고파', sizePx: 32, lineHeightPx: 40, weight: 700 },
 *   ]}
 * />
 */
export function TypeScale({
	items,
}: {
	/** 나열할 타입 토큰 목록 — 위에서 아래로 순서대로 렌더링. */
	items: TypeScaleItem[]
}) {
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
