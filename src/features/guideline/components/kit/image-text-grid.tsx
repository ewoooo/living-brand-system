import { MediaCell } from './media-cell'

// 개념 A: 이미지+텍스트 항목의 그리드. status 없음(판정 개념 없음).
export type ImageTextItem = { src: string; alt?: string; caption?: string }

export function ImageTextGrid({
	items,
	columns = 3,
}: {
	items: ImageTextItem[]
	columns?: number
}) {
	return (
		<div
			className="grid gap-5"
			style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
		>
			{items.map((item) => (
				<MediaCell
					key={item.caption ?? item.src}
					src={item.src}
					alt={item.alt}
					caption={item.caption}
				/>
			))}
		</div>
	)
}
