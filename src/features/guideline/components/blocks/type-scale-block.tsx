import type { GuidelineDocument } from '@/payload-types'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type TypeScale = Extract<GuidelineBlock, { blockType: 'typeScale' }>

const FALLBACK_SAMPLE = 'Aa Bb Cc 가나다'

// Carbon type-scale 이식: 각 타입 토큰을 실제 크기 샘플 + 스펙(size/line-height/weight)으로 나열.
// 서체 관계가 populate되면 familyName을 CSS font-family로 사용한다(전역 로드 전제).
export function TypeScaleBlock({ block }: { block: TypeScale }) {
	const fontFamily =
		typeof block.typeface === 'object' && block.typeface !== null
			? block.typeface.familyName
			: undefined

	return (
		<dl className="flex flex-col">
			{(block.items ?? []).map((item) => (
				<div
					key={item.id}
					className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:justify-between md:gap-6"
				>
					<dd
						className="min-w-0 truncate text-foreground"
						style={{
							fontFamily,
							fontSize: item.sizePx,
							lineHeight: `${item.lineHeightPx}px`,
							fontWeight: item.weight,
						}}
					>
						{item.sample || FALLBACK_SAMPLE}
					</dd>
					<dt className="type-caption-1 shrink-0 text-foreground-muted tabular-nums md:text-right">
						{item.name} · {item.sizePx}/{item.lineHeightPx} · {item.weight}
					</dt>
				</div>
			))}
		</dl>
	)
}
