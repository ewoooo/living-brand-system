import { Carousel } from '../blocks/children/carousel'

// 갤러리 전시용 demo — 제품 Carousel은 blocks/children이 소유하고, mock 슬라이드만 여기 남긴다.
const slide = (label: string, color: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="${color}"/><text x="480" y="290" font-family="sans-serif" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text></svg>`,
	)}`

export function CarouselDemo() {
	return (
		<Carousel
			autoPlay
			slides={[
				{
					image: slide('Key Visual 01', '#262626'),
					caption: '메인 키 비주얼 — 식물성 원료의 생명력.',
				},
				{ image: slide('Ampoule', '#525252'), caption: '앰플 제품 라인 대표 컷.' },
				{ image: slide('Ritual', '#404040'), caption: '데일리 스킨케어 루틴 시리즈.' },
				{ image: slide('Seasonal', '#737373'), caption: '시즌 캠페인 키 비주얼.' },
			]}
		/>
	)
}
