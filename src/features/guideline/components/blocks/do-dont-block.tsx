import { cn } from '@/lib/utils'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import { GuidelineImage } from '../globals/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>
type Group = NonNullable<DoDont['groups']>[number]
type GroupLayout = NonNullable<DoDont['groupLayout']>

// 예시가 1개인 그룹은 그리드를 풀고 전체 폭을 쓴다 — 컬럼 수는 콘텐츠에서 유도한다.
function exampleGridClass(count: number, variant: GroupLayout) {
	if (count <= 1) return 'grid gap-4'
	return variant === 'horizontal'
		? 'grid grid-cols-2 gap-4'
		: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
}

const kindBadge = {
	do: { symbol: '✓', className: 'bg-primary text-primary-foreground' },
	ok: { symbol: '△', className: 'bg-secondary text-secondary-foreground' },
	dont: { symbol: '✕', className: 'bg-destructive/10 text-destructive' },
} as const

export function DoDontBlock({ block }: { block: DoDont }) {
	const variant = block.groupLayout ?? 'vertical'

	return (
		<section className="bg-neutral-100">
			<GuidelineHeader variant="block" title={block.title} className="sr-only" />
			<div
				className={
					variant === 'horizontal'
						? 'grid gap-x-10 gap-y-4 lg:grid-cols-2'
						: 'flex flex-col gap-10'
				}
			>
				{block.groups?.map((group) => (
					<DoDontGroup
						key={group.id}
						group={group}
						variant={variant}
						imageRatio={block.imageRatio}
					/>
				))}
			</div>
		</section>
	)
}

function DoDontGroup({
	group,
	variant,
	imageRatio,
}: {
	group: Group
	variant: GroupLayout
	imageRatio: DoDont['imageRatio']
}) {
	const badge = kindBadge[group.kind]
	const examples = group.examples ?? []

	return (
		<div
			className={cn(variant === 'horizontal' && 'lg:row-span-2 lg:grid lg:grid-rows-subgrid')}
		>
			{(group.category || group.description) && (
				<div className={cn('mb-4 space-y-1', variant === 'horizontal' && 'lg:mb-0')}>
					{group.category && (
						<h4 className="font-body text-base font-semibold text-muted-foreground">
							{group.category}
						</h4>
					)}
					{group.description && (
						<GuidelineDescription variant="block" description={group.description} />
					)}
				</div>
			)}

			<div
				className={cn(
					exampleGridClass(examples.length, variant),
					variant === 'horizontal' && 'lg:row-start-2',
				)}
			>
				{examples.map((example) => (
					<figure key={example.id}>
						<div className="relative">
							<GuidelineImage
								variant="block"
								image={example.image}
								alt={example.caption || ''}
								ratio={imageRatio}
								className="bg-muted"
								imgClassName="size-full object-cover"
							/>
							<span
								aria-hidden
								className={cn(
									'absolute top-2 right-2 grid size-6 place-items-center rounded-full font-body text-xs font-medium',
									badge.className,
								)}
							>
								{badge.symbol}
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
	)
}
