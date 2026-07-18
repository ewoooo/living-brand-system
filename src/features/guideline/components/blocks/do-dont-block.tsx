import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { BlockHeading } from './children/block-heading'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>

// 예시가 1개인 그룹은 그리드를 풀고 전체 폭을 쓴다 — 컬럼 수는 콘텐츠에서 유도한다.
function exampleGridClass(count: number, horizontal: boolean) {
	if (count <= 1) return 'grid gap-4'
	return horizontal ? 'grid grid-cols-2 gap-4' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
}

const kindBadge = {
	do: { symbol: '✓', className: 'bg-primary text-primary-foreground' },
	ok: { symbol: '△', className: 'bg-secondary text-secondary-foreground' },
	dont: { symbol: '✕', className: 'bg-destructive/10 text-destructive' },
} as const

export function DoDontBlock({ block }: { block: DoDont }) {
	const horizontal = block.groupLayout === 'horizontal'
	const ratio = IMAGE_RATIO_CLASS_NAMES[block.imageRatio ?? '4:3']
	return (
		<section>
			<BlockHeading title={block.title} />
			{/* 가로 스택: 그룹을 헤더/그리드 2행 subgrid로 걸쳐 그리드 시작선을 정렬한다.
			    같은 줄의 그룹끼리만 정렬된다 — 3개 이상이 줄바꿈되면 줄 단위로 정렬. */}
			<div
				className={
					horizontal ? 'grid gap-x-10 gap-y-4 lg:grid-cols-2' : 'flex flex-col gap-10'
				}
			>
				{block.groups?.map((group) => (
					<div
						key={group.id}
						className={
							horizontal ? 'lg:row-span-2 lg:grid lg:grid-rows-subgrid' : undefined
						}
					>
						{(group.category || group.description) && (
							<div
								className={horizontal ? 'mb-4 space-y-1 lg:mb-0' : 'mb-4 space-y-1'}
							>
								{group.category && (
									<h4 className="font-body text-base font-semibold text-muted-foreground">
										{group.category}
									</h4>
								)}
								{group.description && (
									<p className="max-w-prose font-body text-sm font-normal text-muted-foreground">
										{group.description}
									</p>
								)}
							</div>
						)}
						<div
							className={`${exampleGridClass(group.examples?.length ?? 0, horizontal)}${
								horizontal ? ' lg:row-start-2' : ''
							}`}
						>
							{group.examples?.map((example, _, examples) => (
								<figure key={example.id}>
									<div className="relative">
										<GuidelineImage
											image={example.image}
											alt={example.caption || ''}
											className={
												examples.length <= 1
													? 'bg-muted'
													: `${ratio} bg-muted`
											}
											imgClassName={
												examples.length <= 1
													? 'w-full'
													: 'size-full object-cover'
											}
										/>
										<span
											aria-hidden
											className={`absolute top-2 right-2 grid size-6 place-items-center rounded-full font-body text-xs font-medium ${kindBadge[group.kind].className}`}
										>
											{kindBadge[group.kind].symbol}
										</span>
									</div>
									{example.caption && (
										<figcaption className="mt-2 font-body text-sm font-normal text-muted-foreground">
											{example.caption}
										</figcaption>
									)}
								</figure>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
