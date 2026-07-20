import { cn } from '@/lib/utils'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import { GuidelineImage } from '../globals/guideline-image'
import { GuidelineBlockFrame } from './common/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>
type Group = NonNullable<DoDont['groups']>[number]
type Example = NonNullable<Group['examples']>[number]

const exampleColumnClass = {
	'2': 'lg:grid-cols-2',
	'3': 'lg:grid-cols-3',
	'4': 'lg:grid-cols-4',
} as const

function exampleGridClass(count: number, columns: keyof typeof exampleColumnClass) {
	if (count <= 1) return 'grid gap-4'
	return cn('grid gap-4 sm:grid-cols-2', exampleColumnClass[columns])
}

function horizontalGridClass(count: number) {
	if (count <= 1) return 'lg:grid-cols-1'
	if (count === 3 || count >= 5) return 'lg:grid-cols-3'
	return 'lg:grid-cols-2'
}

const kindBadge = {
	do: { symbol: '✓', className: 'bg-green-500/20 text-green-800' },
	ok: { symbol: '△', className: 'bg-secondary text-secondary-foreground' },
	dont: { symbol: '✕', className: 'bg-destructive/20 text-destructive' },
} as const

export function DoDontBlock({ block }: { block: DoDont }) {
	const variant = block.groupLayout ?? 'vertical'
	const exampleColumns = block.exampleColumns ?? '3'
	const groups = block.groups ?? []
	const horizontalExamples = groups.flatMap((group) =>
		(group.examples ?? []).map((example, index) => ({ example, group, isFirst: index === 0 })),
	)
	const examplesPerGroup = groups[0]?.examples?.length ?? 0
	const stackByGroup =
		groups.length === 3 &&
		examplesPerGroup >= 2 &&
		groups.every((group) => group.examples?.length === examplesPerGroup)

	return (
		<GuidelineBlockFrame layout="padded" variant="secondary" contentClassName="py-6 md:py-8">
			<section>
				<div className="sr-only">
					<GuidelineHeader variant="block" title={block.title} className="sr-only" />
				</div>
				{variant === 'horizontal' && stackByGroup ? (
					<div className="grid gap-4 lg:grid-cols-3">
						{groups.map((group) => (
							<DoDontGroup
								key={group.id}
								group={group}
								imageRatio={block.imageRatio}
								exampleColumns={exampleColumns}
								stackExamples
							/>
						))}
					</div>
				) : variant === 'horizontal' ? (
					<div
						className={cn('grid gap-4', horizontalGridClass(horizontalExamples.length))}
					>
						{horizontalExamples.map(({ example, group, isFirst }) => (
							<div
								key={example.id}
								className="lg:row-span-2 lg:grid lg:grid-rows-subgrid"
							>
								<div className="mb-4 space-y-1 lg:mb-0">
									{isFirst && <DoDontGroupHeading group={group} />}
								</div>
								<DoDontExample
									example={example}
									kind={group.kind}
									imageRatio={block.imageRatio}
								/>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col gap-10">
						{groups.map((group) => (
							<DoDontGroup
								key={group.id}
								group={group}
								imageRatio={block.imageRatio}
								exampleColumns={exampleColumns}
							/>
						))}
					</div>
				)}
			</section>
		</GuidelineBlockFrame>
	)
}

function DoDontGroup({
	group,
	imageRatio,
	exampleColumns,
	stackExamples = false,
}: {
	group: Group
	imageRatio: DoDont['imageRatio']
	exampleColumns: NonNullable<DoDont['exampleColumns']>
	stackExamples?: boolean
}) {
	const examples = group.examples ?? []

	return (
		<div>
			{(group.category || group.description) && (
				<div className="mb-4 space-y-1">
					<DoDontGroupHeading group={group} />
				</div>
			)}

			<div
				className={
					stackExamples ? 'grid gap-4' : exampleGridClass(examples.length, exampleColumns)
				}
			>
				{examples.map((example) => (
					<DoDontExample
						key={example.id}
						example={example}
						kind={group.kind}
						imageRatio={imageRatio}
					/>
				))}
			</div>
		</div>
	)
}

function DoDontGroupHeading({ group }: { group: Group }) {
	return (
		<>
			{group.category && (
				<h4 className="font-body text-base font-semibold text-muted-foreground">
					{group.category}
				</h4>
			)}
			{group.description && (
				<GuidelineDescription variant="block" description={group.description} />
			)}
		</>
	)
}

function DoDontExample({
	example,
	kind,
	imageRatio,
}: {
	example: Example
	kind: Group['kind']
	imageRatio: DoDont['imageRatio']
}) {
	const badge = kindBadge[kind]

	return (
		<figure>
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
	)
}
