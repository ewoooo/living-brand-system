import type { GuidelineDocument } from '@/payload-types'
import { resolveTypeface, TypefaceFontFace } from './children/typeface-font-face'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type TypeScale = Extract<GuidelineBlock, { blockType: 'typeScale' }>

const FALLBACK_SAMPLE = 'Aa Bb Cc 가나다'

// Carbon type-scale 이식: 각 타입 토큰을 실제 크기 샘플 + 스펙(size/line-height/weight)으로 나열.
// 서체 관계가 populate되면 소유한 폰트 파일로 @font-face를 구성해 familyName을 적용한다.
export function TypeScaleBlock({ block }: { block: TypeScale }) {
	const typeface = resolveTypeface(block.typeface)
	const fontFamily = typeface ? `"${typeface.familyName}", var(--font-body)` : undefined

	return (
		<dl className="flex flex-col">
			<TypefaceFontFace typeface={block.typeface} />
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
					<dt className="shrink-0 font-body text-xs font-normal text-muted-foreground tabular-nums md:text-right">
						{item.name} · {item.sizePx}/{item.lineHeightPx} · {item.weight}
					</dt>
				</div>
			))}
		</dl>
	)
}
