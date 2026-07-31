import type { CSSProperties } from 'react'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { cn } from '@/lib/utils'
import type { ApplicationImage, GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ImageGrid = Extract<GuidelineBlock, { blockType: 'imageGrid' }>
type Cell = NonNullable<ImageGrid['cells']>[number]

// 관계가 populate되면 객체, 아니면 id(number) — 객체일 때만 렌더 값으로 쓴다.
function cellImage(cell: Cell | undefined): ApplicationImage | null {
	return cell?.image != null && typeof cell.image === 'object' ? cell.image : null
}

// 셀 비율은 블록 단위로 하나만 정한다: 고정 비율 / 수동(폭·높이) / 셀 01(첫 셀) 원본 비율.
// 'original'·'firstImage'는 모두 첫 셀 이미지의 원본 비율(width/height)을 그리드 전체에 적용한다.
function resolveRatio(
	block: ImageGrid,
	cells: (Cell | undefined)[],
): { className: string; style?: CSSProperties } {
	const ratio = block.imageRatio ?? '1:1'
	if (ratio === 'manual') {
		if (block.ratioWidth && block.ratioHeight)
			return {
				className: '',
				style: { aspectRatio: `${block.ratioWidth} / ${block.ratioHeight}` },
			}
		return { className: 'aspect-square' }
	}
	if (ratio === 'original' || ratio === 'firstImage') {
		const first = cells.map(cellImage).find(Boolean)
		if (first?.width && first?.height)
			return { className: '', style: { aspectRatio: `${first.width} / ${first.height}` } }
		return { className: 'aspect-square' }
	}
	return { className: IMAGE_RATIO_CLASS_NAMES[ratio] || 'aspect-square' }
}

export function ImageGridBlock({ block }: { block: ImageGrid }) {
	const columns = Math.max(1, block.columns ?? 1)
	const rows = Math.max(1, block.rows ?? 1)
	const cells = block.cells ?? []

	// 격자는 columns×rows 고정. 셀은 행우선으로 채우고, 부족한 칸은 빈 셀로 둔다.
	// ponytail: 정원(columns×rows)을 넘는 셀은 표시하지 않는다 — 행/열 수를 늘려 담는다.
	const slots = Array.from({ length: columns * rows }, (_, index) => cells[index])
	const box = resolveRatio(block, cells)

	return (
		<GuidelineBlockFrame layout="padded">
			<section className="flex flex-col gap-6">
				{/* 제목·설명은 콘텐츠 열(SingleColumnItem)과 동일하게 오른쪽 열(col-start-2)로 정렬해
				    페이지 내 다른 콘텐츠 행과 시각을 통일한다. */}
				{(block.title || block.description) && (
					<div className="grid grid-cols-2 gap-4">
						<div className="col-start-2">
							{block.title && <GuidelineHeader variant="block" title={block.title} />}
							{block.description && (
								<GuidelineDescription
									variant="block"
									description={block.description}
								/>
							)}
						</div>
					</div>
				)}
				<div
					className="grid gap-x-4 gap-y-12"
					style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
				>
					{slots.map((cell, index) => (
						<ImageGridCell
							// biome-ignore lint/suspicious/noArrayIndexKey: 슬롯은 고정 격자 위치라 인덱스가 안정적 키다.
							key={index}
							cell={cell}
							boxClassName={box.className}
							boxStyle={box.style}
						/>
					))}
				</div>
			</section>
		</GuidelineBlockFrame>
	)
}

export default ImageGridBlock

export function ImageGridCell({
	cell,
	boxClassName,
	boxStyle,
}: {
	cell: Cell | undefined
	boxClassName: string
	boxStyle?: CSSProperties
}) {
	const image = cellImage(cell)

	return (
		<figure>
			{/* 이미지는 셀을 꽉 채우고 넘치는 부분은 크롭한다(여백 없음). 배경 없음 — 이미지·텍스트만. */}
			<div
				className={cn('w-full overflow-hidden', boxClassName)}
				style={boxStyle}
				aria-hidden={!image}
			>
				{image?.url && (
					// biome-ignore lint/performance/noImgElement: Payload upload URL은 로컬 또는 S3일 수 있다.
					<img
						src={image.url}
						alt={image.alt || image.name || cell?.caption || ''}
						className="size-full object-cover"
					/>
				)}
			</div>
			{cell?.caption && (
				<figcaption className="mt-2 font-body text-sm font-normal text-muted-foreground">
					{cell.caption}
				</figcaption>
			)}
		</figure>
	)
}
