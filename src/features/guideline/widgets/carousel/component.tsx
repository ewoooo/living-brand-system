import config from '@payload-config'
import { getPayload } from 'payload'
import { Carousel, type CarouselSlide } from '@/features/guideline/blocks/carousel/carousel'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/carousel) 통째 삭제.
//
// 위젯(서버): author 인스턴스 없이 application-images 대표 몇 장을 조회해 캐러셀로 렌더한다(읽기 전용).
// 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각/인터랙션 뷰만. 뷰(Carousel)는 원본 재사용.
// author config(ratio 등)는 기존 blocks/carousel/component.tsx의 fallback 값을 하드코딩.

export async function CarouselWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'application-images',
		limit: 6,
		depth: 0,
		sort: 'createdAt',
	})

	const slides: CarouselSlide[] = docs.map((image) => ({
		id: String(image.id),
		image: image.url ?? undefined,
		alt: image.alt || '',
	}))
	if (slides.length === 0) return null

	return <Carousel slides={slides} aspect={IMAGE_RATIO_CLASS_NAMES['16:9']} />
}

export default CarouselWidget
