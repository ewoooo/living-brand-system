import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelineDocument } from '@/payload-types'
import { Carousel, type CarouselSlide } from './children/carousel'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ContentColumns = Extract<GuidelineBlock, { blockType: 'contentColumns' }>
type Column = NonNullable<ContentColumns['columns']>[number]

// 본문 워크호스: 이미지 + 텍스트 유닛. 경계선/라운드 없이(팀 규범) 깔끔한 에디토리얼 레이아웃.
// 규칙: 한 블록 안 예시 이미지가 3장 이상이면 자동 캐러셀로 압축(규칙/스펙 텍스트는 별도 블록에서 전부 노출).
// 그 외에는 이미지를 자연 비율로 통째 노출(placeholder 캡쳐도 레터박스 없이). 1열=스택, 2열=그리드.
export function ContentColumnsBlock({ block }: { block: ContentColumns }) {
	const columns = block.columns ?? []
	if (columns.length === 0) return null

	// 예시 3장 이상 → 자동 슬라이드 캐러셀.
	if (columns.length >= 3) {
		const slides = columns
			.map((column): CarouselSlide | null => {
				const url =
					typeof column.image === 'object' && column.image?.url ? column.image.url : null
				return url
					? {
							image: url,
							alt: column.heading || '',
							caption: column.heading || undefined,
						}
					: null
			})
			.filter((slide): slide is CarouselSlide => slide !== null)
		if (slides.length >= 3) {
			return (
				<section>
					<Carousel autoPlay slides={slides} />
				</section>
			)
		}
	}

	const gridClass =
		columns.length >= 3
			? 'grid gap-8 md:grid-cols-3'
			: columns.length === 2
				? 'grid gap-8 md:grid-cols-2'
				: 'flex flex-col gap-10'

	return (
		<section className={gridClass}>
			{columns.map((column) => (
				<Item key={column.id} column={column} />
			))}
		</section>
	)
}

function Item({ column }: { column: Column }) {
	return (
		<figure className="m-0 flex flex-col gap-4">
			<GuidelineImage
				image={column.image}
				alt={column.heading || ''}
				backgroundColor={column.imageBackgroundColor}
				scale={column.imageScale}
				className="w-full bg-fill-muted"
				imgClassName="h-auto w-full object-contain"
			/>
			{(column.heading || column.body) && (
				<div className="flex flex-col gap-3">
					{column.heading && (
						<h4 className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
							{column.heading}
						</h4>
					)}
					{column.body && (
						<RichText
							data={column.body}
							className="type-body flex max-w-2xl flex-col gap-3 text-foreground"
						/>
					)}
				</div>
			)}
		</figure>
	)
}
