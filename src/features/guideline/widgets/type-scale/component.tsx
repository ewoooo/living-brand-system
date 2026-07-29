import config from '@payload-config'
import { getPayload } from 'payload'
import { TypefaceFontFace } from '@/features/guideline/blocks/shared/typeface-font-face'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/type-scale) 통째 삭제.
//
// 위젯(서버): 첫 brand-typeface로 @font-face만 조립하고, 스케일 항목은 자족 기본값으로 하드코딩(author 선택 없음).
// 프레임/텍스트(GuidelineHeader/Description/BlockFrame)는 컨테이너 Block이 소유하므로 위젯은 스케일 목록만 렌더.
// 렌더 마크업은 blocks/type-scale/component.tsx와 동일(별도 view 파일 없음).

const FALLBACK_SAMPLE = 'Aa Bb Cc 가나다'

// author config 대체 기본 스케일(Carbon 계열 토큰). 브랜드 무관 수치.
const DEFAULT_ITEMS = [
	{ name: 'Display', sizePx: 54, lineHeightPx: 64, weight: 600 },
	{ name: 'Heading 1', sizePx: 42, lineHeightPx: 50, weight: 600 },
	{ name: 'Heading 2', sizePx: 32, lineHeightPx: 40, weight: 600 },
	{ name: 'Heading 3', sizePx: 24, lineHeightPx: 32, weight: 500 },
	{ name: 'Body', sizePx: 16, lineHeightPx: 24, weight: 400 },
	{ name: 'Caption', sizePx: 12, lineHeightPx: 16, weight: 400 },
]

export async function TypeScaleWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'brand-typefaces',
		limit: 1,
		depth: 0,
		sort: 'createdAt',
	})
	const typeface = docs[0]
	const fontFamily = typeface?.familyName
		? `"${typeface.familyName}", var(--font-body)`
		: undefined

	return (
		<dl className="flex flex-col">
			<TypefaceFontFace typeface={typeface} />
			{DEFAULT_ITEMS.map((item) => (
				<div
					key={item.name}
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
						{FALLBACK_SAMPLE}
					</dd>
					<dt className="shrink-0 font-body text-xs font-normal text-muted-foreground tabular-nums md:text-right">
						{item.name} · {item.sizePx}/{item.lineHeightPx} · {item.weight}
					</dt>
				</div>
			))}
		</dl>
	)
}

export default TypeScaleWidget
