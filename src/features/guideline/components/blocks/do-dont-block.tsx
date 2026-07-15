import type { GuidelineDocument } from '@/payload-types'
import { BlockHeading } from './children/block-heading'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>

// Tailwind가 정적으로 감지해야 하므로 클래스 전체 문자열을 나열한다.
const ratioClass = {
	'4:3': 'aspect-4/3',
	'1:1': 'aspect-square',
	'16:9': 'aspect-video',
} as const

// 예시가 1개인 그룹은 그리드를 풀고 전체 폭을 쓴다 — 컬럼 수는 콘텐츠에서 유도한다.
function exampleGridClass(count: number, horizontal: boolean) {
	if (count <= 1) return 'grid gap-4'
	return horizontal ? 'grid grid-cols-2 gap-4' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
}

const kindBadge = {
	do: { symbol: '✓', className: 'bg-success text-success-foreground' },
	ok: { symbol: '△', className: 'bg-warning text-warning-foreground' },
	dont: { symbol: '✕', className: 'bg-destructive text-destructive-foreground' },
} as const

export function DoDontBlock({ block }: { block: DoDont }) {
	const horizontal = block.groupLayout === 'horizontal'
	const ratio = ratioClass[block.imageRatio ?? '4:3']
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
									<h4 className="type-body-emphasized text-foreground-muted">
										{group.category}
									</h4>
								)}
								{group.description && (
									<p className="type-callout max-w-prose text-foreground-muted">
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
													? 'bg-fill-muted'
													: `${ratio} bg-fill-muted`
											}
											imgClassName={
												examples.length <= 1
													? 'w-full'
													: 'size-full object-cover'
											}
										/>
										<span
											aria-hidden
											className={`type-caption-1-emphasized absolute top-2 right-2 grid size-6 place-items-center rounded-full ${kindBadge[group.kind].className}`}
										>
											{kindBadge[group.kind].symbol}
										</span>
									</div>
									{example.caption && (
										<figcaption className="type-callout mt-2 text-foreground-muted">
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
