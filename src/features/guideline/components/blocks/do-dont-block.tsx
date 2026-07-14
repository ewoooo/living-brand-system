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
							<h4 className="mb-4 font-semibold text-neutral-500">
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
											className="aspect-4/3 bg-neutral-500/5 p-6"
										/>
										<span
											aria-hidden
											className={`absolute top-2 right-2 grid size-6 place-items-center rounded-full text-white text-xs ${
												example.kind === 'do'
													? 'bg-emerald-600'
													: 'bg-red-600'
											}`}
										>
											{example.kind === 'do' ? '✓' : '✕'}
										</span>
									</div>
									{example.caption && (
										<figcaption className="mt-2 text-neutral-500 text-sm leading-6">
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
