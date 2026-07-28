import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ContentColumns = Extract<GuidelineBlock, { blockType: 'contentColumns' }>
type Column = NonNullable<ContentColumns['columns']>[number]

// 이미지 관계가 populate된 객체이고 url이 있을 때만 이미지로 본다. 없으면 빈 슬롯(fallback)을 만들지 않는다.
function hasImage(column: Column): boolean {
	return typeof column.image === 'object' && column.image !== null && Boolean(column.image.url)
}

// 본문 워크호스: 이미지 + 텍스트 유닛. 1열은 스택, 2~3열은 그리드로 표시한다.
export function ContentColumnsBlock({ block }: { block: ContentColumns }) {
	const columns = block.columns ?? []
	let variant = 0
	let GRID_CLASS = 'flex flex-col gap-10'

	if (columns.length === 0) return null
	else variant = columns.length

	if (variant === 1) GRID_CLASS = 'flex flex-col gap-10'
	else GRID_CLASS = `grid gap-4 md:grid-cols-${variant}`

	return (
		<GuidelineBlockFrame layout="padded">
			<section className={GRID_CLASS}>
				{variant === 1 &&
					columns.map((column) => (
						<SingleColumnItem
							key={column.id}
							column={column}
							ratio={block.imageRatio}
						/>
					))}
				{variant !== 1 &&
					columns.map((column) => (
						<MutlipleColumnItem
							key={column.id}
							column={column}
							ratio={block.imageRatio}
						/>
					))}
			</section>
		</GuidelineBlockFrame>
	)
}

export default ContentColumnsBlock

function SingleColumnItem({
	column,
	ratio,
}: {
	column: Column
	ratio: ContentColumns['imageRatio']
}) {
	// 이미지 없으면 빈 이미지 슬롯은 안 띄우되, 텍스트 정렬은 이미지 있을 때와 동일하게
	// 오른쪽 열(col-start-2 = 수평 가운데부터)로 맞춘다. 다른 콘텐츠 행과 같은 스타일 유지.
	if (!hasImage(column)) {
		return (
			<div className="grid grid-cols-2 gap-4">
				<div className="col-start-2">
					{column.heading && <GuidelineHeader variant="block" title={column.heading} />}
					{column.body && (
						<GuidelineDescription variant="block" description={column.body} />
					)}
				</div>
			</div>
		)
	}
	return (
		<figure className="flex flex-col gap-2">
			<GuidelineImage
				variant="block"
				image={column.image}
				alt={column.heading || ''}
				backgroundColor={column.imageBackgroundColor}
				scale={column.imageScale}
				ratio={ratio}
				className="w-full bg-fill-muted"
				imgClassName="h-auto w-full object-contain"
			/>
			<figcaption className="grid grid-cols-2 gap-4">
				<div className="col-start-2">
					{column.heading && <GuidelineHeader variant="block" title={column.heading} />}
					{column.body && (
						<GuidelineDescription variant="block" description={column.body} />
					)}
				</div>
			</figcaption>
		</figure>
	)
}

function MutlipleColumnItem({
	column,
	ratio,
}: {
	column: Column
	ratio: ContentColumns['imageRatio']
}) {
	return (
		<figure className="flex flex-col gap-2">
			{hasImage(column) && (
				<GuidelineImage
					variant="block"
					image={column.image}
					alt={column.heading || ''}
					backgroundColor={column.imageBackgroundColor}
					scale={column.imageScale}
					ratio={ratio}
					className="w-full bg-fill-muted"
					imgClassName="h-auto w-full object-contain"
				/>
			)}
			{(column.heading || column.body) && (
				<div className="flex flex-col gap-1">
					{column.heading && <GuidelineHeader variant="block" title={column.heading} />}
					{column.body && (
						<GuidelineDescription variant="block" description={column.body} />
					)}
				</div>
			)}
		</figure>
	)
}
