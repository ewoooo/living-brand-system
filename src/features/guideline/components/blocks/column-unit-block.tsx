import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ColumnUnit = Extract<GuidelineBlock, { blockType: 'columnUnit' }>
type Column = NonNullable<ColumnUnit['columns']>[number]

// 본문 워크호스: 이미지+텍스트 유닛. Carbon Tile 패턴(레이어 배경 $layer + 경계 $border-tile + 여백)을
// 팀 시맨틱 토큰으로 이식했다. 1열=가로 배치(이미지│설명), 2~3열=세로 미디어 타일 그리드.
export function ColumnUnitBlock({ block }: { block: ColumnUnit }) {
	const columns = block.columns ?? []
	if (columns.length === 0) return null

	const ratioClass = IMAGE_RATIO_CLASS_NAMES[block.imageRatio ?? '4:3']

	// 1열: 이미지와 설명을 좌우로 나란히. 긴 설명이 큰 이미지 아래로 밀리지 않게.
	if (columns.length === 1) {
		const column = columns[0]
		return (
			<section className="overflow-hidden rounded-lg border border-scrim/10 bg-background-secondary md:grid md:grid-cols-2">
				<MediaFrame
					column={column}
					ratioClass={ratioClass}
					className="border-scrim/10 border-b md:border-r md:border-b-0"
				/>
				<TextBody heading={column.heading} body={column.body} />
			</section>
		)
	}

	// 2~3열: 세로 미디어 타일을 그리드로. (columnUnit은 최대 3열)
	const gridColumns = columns.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
	return (
		<section className={`grid gap-5 ${gridColumns}`}>
			{columns.map((column) => (
				<figure
					key={column.id}
					className="m-0 flex flex-col overflow-hidden rounded-lg border border-scrim/10 bg-background-secondary"
				>
					<MediaFrame
						column={column}
						ratioClass={ratioClass}
						className="border-scrim/10 border-b"
					/>
					<TextBody heading={column.heading} body={column.body} />
				</figure>
			))}
		</section>
	)
}

// 미디어 영역: 도판을 잘리지 않게(object-contain) 어두운 인셋 위에 얹는다. 이미지 없으면 렌더 안 함.
function MediaFrame({
	column,
	ratioClass,
	className,
}: {
	column: Column
	ratioClass: string
	className?: string
}) {
	return (
		<GuidelineImage
			image={column.image}
			alt={column.heading || ''}
			backgroundColor={column.imageBackgroundColor}
			scale={column.imageScale}
			className={`${ratioClass} bg-background p-6 ${className ?? ''}`}
		/>
	)
}

function TextBody({ heading, body }: { heading?: Column['heading']; body?: Column['body'] }) {
	if (!heading && !body) return null
	return (
		<div className="flex flex-col gap-3 p-6">
			{heading && <h4 className="type-body-emphasized text-foreground">{heading}</h4>}
			{body && (
				<RichText
					data={body}
					className="type-body flex flex-col gap-3 text-foreground-muted"
				/>
			)}
		</div>
	)
}
