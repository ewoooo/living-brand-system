import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/media-showcase) 통째 삭제.
//
// 위젯(서버): application-images에서 대표 이미지 몇 개를 조회해 그리드로 렌더한다(author 선택 없음, 읽기 전용).
// 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각(GuidelineImage)만 렌더. 뷰는 원본 재사용.
const DEFAULT = { ratio: '16:9' as const, scale: '100' }

export async function MediaShowcaseWidget() {
	const payload = await getPayload({ config })
	const { docs: images } = await payload.find({
		collection: 'application-images',
		limit: 3,
		depth: 0,
		sort: 'createdAt',
	})

	if (images.length === 0) return null

	const columns =
		images.length === 2 ? 'md:grid-cols-2' : images.length >= 3 ? 'md:grid-cols-3' : ''

	return (
		<section className={`grid gap-4 ${columns}`}>
			{images.map((image) => (
				<GuidelineImage
					key={image.id}
					variant="block"
					image={image}
					scale={DEFAULT.scale}
					ratio={DEFAULT.ratio}
					className="w-full py-8"
				/>
			))}
		</section>
	)
}

export default MediaShowcaseWidget
