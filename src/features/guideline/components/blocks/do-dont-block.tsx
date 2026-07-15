import { CheckmarkFilled, Misuse } from '@carbon/icons-react'
import { cn } from '@/lib/utils'
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
							<h4 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
								{group.category}
							</h4>
						)}
						<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{group.examples?.map((example) => {
								const isDo = example.kind === 'do'
								return (
									<figure key={example.id} className="flex flex-col">
										<GuidelineImage
											image={example.image}
											alt={example.caption || ''}
											className={cn(
												'aspect-4/3 border border-border border-t-[3px] bg-muted/30 p-6',
												isDo ? 'border-t-emerald-600' : 'border-t-red-600',
											)}
										/>
										<figcaption className="mt-3 flex items-start gap-2 text-sm leading-6">
											{isDo ? (
												<CheckmarkFilled
													className="mt-0.5 shrink-0 text-emerald-600"
													size={16}
												/>
											) : (
												<Misuse className="mt-0.5 shrink-0 text-red-600" size={16} />
											)}
											<span>
												<span
													className={cn(
														'font-semibold',
														isDo
															? 'text-emerald-700 dark:text-emerald-500'
															: 'text-red-700 dark:text-red-500',
													)}
												>
													{isDo ? 'Do' : "Don't"}
												</span>
												{example.caption && (
													<span className="text-muted-foreground"> — {example.caption}</span>
												)}
											</span>
										</figcaption>
									</figure>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
