import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import { cn } from '@/lib/utils'
import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type ImageGrid = Extract<GuidelineBlock, { blockType: 'imageGrid' }>
type Cell = NonNullable<ImageGrid['cells']>[number]

export function ImageGridBlock({ block }: { block: ImageGrid }) {
	const columns = Math.max(1, block.columns ?? 1)
	const rows = Math.max(1, block.rows ?? 1)
	const ratio = block.imageRatio ?? '1:1'
	const cells = block.cells ?? []

	// 격자는 columns×rows 고정. 셀은 행우선으로 채우고, 부족한 칸은 빈 셀로 둔다.
	// ponytail: 정원(columns×rows)을 넘는 셀은 표시하지 않는다 — 행/열 수를 늘려 담는다.
	const slots = Array.from({ length: columns * rows }, (_, index) => cells[index])

	return (
		<GuidelineBlockFrame layout="padded">
			<section>
				<div className="sr-only">
					<GuidelineHeader variant="block" title={block.title} className="sr-only" />
				</div>
				<div
					className="grid gap-4"
					style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
				>
					{slots.map((cell, index) => (
						<ImageGridCell
							// biome-ignore lint/suspicious/noArrayIndexKey: 슬롯은 고정 격자 위치라 인덱스가 안정적 키다.
							key={index}
							cell={cell}
							ratio={ratio}
						/>
					))}
				</div>
			</section>
		</GuidelineBlockFrame>
	)
}

export default ImageGridBlock

function ImageGridCell({
	cell,
	ratio,
}: {
	cell: Cell | undefined
	ratio: ImageGrid['imageRatio']
}) {
	const hasImage = cell?.image != null && typeof cell.image === 'object'
	const ratioClassName = IMAGE_RATIO_CLASS_NAMES[ratio ?? '1:1'] || 'aspect-square'

	return (
		<figure>
			{hasImage ? (
				<GuidelineImage
					variant="block"
					image={cell?.image}
					alt={cell?.caption || ''}
					ratio={ratio}
					className="w-full bg-muted"
					imgClassName="size-full object-contain"
				/>
			) : (
				<div className={cn('w-full', ratioClassName)} aria-hidden />
			)}
			{cell?.caption && (
				<figcaption className="mt-2 font-body text-sm font-normal text-muted-foreground">
					{cell.caption}
				</figcaption>
			)}
		</figure>
	)
}
