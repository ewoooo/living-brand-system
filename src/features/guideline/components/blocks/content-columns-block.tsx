import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ContentColumns = Extract<GuidelineBlock, { blockType: 'contentColumns' }>
type Column = NonNullable<ContentColumns['columns']>[number]

// 본문 워크호스: 이미지 + 텍스트 유닛. 1열은 스택, 2~3열은 그리드로 표시한다.
export function ContentColumnsBlock({ block }: { block: ContentColumns }) {
	const columns = block.columns ?? []
	if (columns.length === 0) return null

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
