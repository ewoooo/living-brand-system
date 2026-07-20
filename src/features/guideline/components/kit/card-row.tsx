import Image, { type StaticImageData } from 'next/image'
import card1 from './images/layout_base_image_card1.webp'
import card2 from './images/layout_base_image_card2.webp'
import card3 from './images/layout_base_image_card3.webp'
import card4 from './images/layout_base_image_card4.webp'

// 카드 이미지를 한 줄에 4개로 배치하는 레이아웃(리플릿 하단 제품 밴드 형태). 브랜드 무관·props 주입.
export function CardRow({ images }: { images: StaticImageData[] }) {
	return (
		<div className="grid grid-cols-4 gap-4">
			{images.map((image, i) => (
				<Image
					key={image.src}
					src={image}
					alt={`카드 ${i + 1}`}
					className="h-auto w-full rounded-md border border-border object-cover"
				/>
			))}
		</div>
	)
}

const CARDS = [card1, card2, card3, card4]

export function CardRowDemo() {
	return <CardRow images={CARDS} />
}
