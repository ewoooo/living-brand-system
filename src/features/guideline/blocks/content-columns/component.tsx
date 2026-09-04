import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { RIGHT_HALF } from '../shared/rhythm'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ContentColumns = Extract<GuidelineBlock, { blockType: 'contentColumns' }>
type Column = NonNullable<ContentColumns['columns']>[number]

// 이미지 관계가 populate된 객체이고 url이 있을 때만 이미지로 본다. 없으면 빈 슬롯(fallback)을 만들지 않는다.
function hasImage(column: Column): boolean {
	return typeof column.image === 'object' && column.image !== null && Boolean(column.image.url)
}

// 열 수별 완전 클래스 — 문자열 보간(`md:grid-cols-${n}`)은 Tailwind가 빌드 타임에 못 본다(docs/10 §4).
// 열은 admin 스키마가 1~3으로 막는다. 그 밖의 수는 3열 그리드로 흘린다.
const GRID_BY_COLUMNS: Record<number, string> = {
	1: 'flex flex-col gap-10',
	2: 'grid gap-4 md:grid-cols-2',
	3: 'grid gap-4 md:grid-cols-3',
}

// 본문 워크호스: 이미지 + 텍스트 유닛. 1열은 스택, 2~3열은 그리드로 표시한다.
export function ContentColumnsBlock({ block }: { block: ContentColumns }) {
	const columns = block.columns ?? []
	const variant = columns.length

	if (variant === 0) return null

	return (
		<GuidelineBlockFrame layout="padded">
			<div className={GRID_BY_COLUMNS[variant] ?? GRID_BY_COLUMNS[3]}>
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
			</div>
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
	// 이미지 없으면 빈 이미지 슬롯은 안 띄우되, 텍스트는 이미지 있을 때와 같은 오른쪽 반칸에 둔다.
	if (!hasImage(column)) {
		return (
			<div className={`${RIGHT_HALF.grid} gap-4`}>
				<div className={RIGHT_HALF.cell}>
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
				image={column.image}
				alt={column.heading || ''}
				backgroundColor={column.imageBackgroundColor}
				scale={column.imageScale}
				ratio={ratio}
				className="w-full bg-fill-muted"
				imgClassName="h-auto w-full object-contain"
			/>
			<figcaption className={`${RIGHT_HALF.grid} gap-4`}>
				<div className={RIGHT_HALF.cell}>
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
