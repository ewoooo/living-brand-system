import { MediaCell } from './media-cell'

// 개념 A: 이미지+텍스트 항목의 그리드. status 없음(판정 개념 없음).
export type ImageTextItem = { src: string; alt?: string; caption?: string }

/**
 * 이미지+캡션 항목의 그리드(각 셀이 자기 캡션을 가짐). 판정(do/dont)이 필요하면 DoDont을 쓴다.
 *
 * @example
 * <ImageTextGrid
 *   columns={3}
 *   items={[
 *     { src: url1, caption: '단색 배경 위 기본 로고.' },
 *     { src: url2, caption: '사진 위엔 반전 로고.' },
 *   ]}
 * />
 */
export function ImageTextGrid({
	items,
	columns = 3,
}: {
	/** 이미지+캡션 항목 목록. */
	items: ImageTextItem[]
	/** 열 수(기본 3). */
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
