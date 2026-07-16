// 이미지 그룹: 헤더 + 이미지 세트(2~4장, row 배치) + 본문(옵션).
// 개요/구성 설명용 — 한눈에 비교되도록 row. (동종 사용예시가 여럿이면 Carousel을 쓴다.)
export type ImageGroupImage = { src: string; alt?: string }

// 이미지 장수(2~4)별 열 클래스. Tailwind 정적 감지를 위해 문자열을 전부 나열한다.
const colClass: Record<number, string> = {
	2: 'grid-cols-2',
	3: 'grid-cols-3',
	4: 'grid-cols-2 md:grid-cols-4',
}

export function ImageGroup({
	header,
	images,
	body,
}: {
	header?: string
	images: ImageGroupImage[]
	body?: string
}) {
	if (images.length === 0) return null
	const cols = colClass[images.length] ?? 'grid-cols-2'

	return (
		<section className="flex flex-col gap-4">
			{header && <h4 className="type-body-emphasized font-bold text-foreground">{header}</h4>}
			<div className={`grid items-start gap-4 ${cols}`}>
				{images.map((image) => (
					// biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용.
					<img
						key={image.src}
						src={image.src}
						alt={image.alt ?? ''}
						className="h-auto w-full bg-fill-muted object-contain"
					/>
				))}
			</div>
			{body && <p className="type-body max-w-2xl text-foreground-muted">{body}</p>}
		</section>
	)
}

const shot = (label: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#3f3f3f"/><text x="200" y="260" font-family="sans-serif" font-size="26" fill="#d4d4d4" text-anchor="middle">${label}</text></svg>`,
	)}`

export function ImageGroupDemo() {
	return (
		<div className="flex flex-col gap-10">
			<ImageGroup
				header="Brand Contents"
				images={[
					{ src: shot('Feed 01') },
					{ src: shot('Feed 02') },
					{ src: shot('Feed 03') },
					{ src: shot('Feed 04') },
				]}
				body="브랜드가 지향하는 이미지를 표현하고 브랜드 메시지를 고객에게 전달하는 콘텐츠 예시."
			/>
			<ImageGroup
				header="Product Contents"
				images={[
					{ src: shot('Product 01') },
					{ src: shot('Product 02') },
					{ src: shot('Product 03') },
				]}
			/>
		</div>
	)
}
