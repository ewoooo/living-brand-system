import type { GuidelineDocument } from '@/payload-types'
import { BlockHeading } from './children/block-heading'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type DoDont = Extract<GuidelineBlock, { blockType: 'doDont' }>

export function DoDontBlock({ block }: { block: DoDont }) {
	return (
		<section>
			<BlockHeading title={block.title} />
			<div className="flex flex-col gap-10">
				{block.groups?.map((group) => (
					<div key={group.id}>
						{group.category && (
							<h4 className="type-body-emphasized mb-4 text-foreground-muted">
								{group.category}
							</h4>
						)}
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{group.examples?.map((example) => (
								<figure key={example.id}>
									<div className="relative">
										<GuidelineImage
											image={example.image}
											alt={example.caption || ''}
											className="aspect-4/3 bg-fill-muted p-6"
										/>
										<span
											aria-hidden
											className={`type-caption-1-emphasized absolute top-2 right-2 grid size-6 place-items-center rounded-full ${
												example.kind === 'do'
													? 'bg-success text-success-foreground'
													: 'bg-destructive text-destructive-foreground'
											}`}
										>
											{example.kind === 'do' ? '✓' : '✕'}
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
