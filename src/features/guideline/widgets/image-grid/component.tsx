import config from '@payload-config'
import { getPayload } from 'payload'
import { ImageGridCell } from '@/features/guideline/blocks/image-grid/component'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/image-grid) 통째 삭제.
//
// 위젯(서버): application-images 컬렉션에서 대표 이미지를 뽑아 그리드로 렌더한다(author 선택 없음, 읽기 전용).
// 프레임/제목/설명은 컨테이너 Block이 소유하므로 위젯은 그리드 시각만. 셀 뷰(ImageGridCell)는 원본 재사용.
// author config(columns/ratio)는 블록 기본값으로 하드코딩: columns 3, 비율 1:1(aspect-square).
const COLUMNS = 3

export async function ImageGridWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'application-images',
		limit: 9,
		depth: 0,
		sort: 'createdAt',
	})

	if (docs.length === 0) return null

	return (
		<div
			className="grid gap-x-4 gap-y-12"
			style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
		>
			{docs.map((image) => (
				<ImageGridCell key={image.id} cell={{ image }} boxClassName="aspect-square" />
			))}
		</div>
	)
}

export default ImageGridWidget
