import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelinePage } from '@/payload-types'
import { BlockHeading } from './children/block-heading'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

export function ColumnUnitBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'columnUnit' }>
}) {
	const gridClassName =
		block.columns && block.columns.length > 1 ? 'grid gap-8 md:grid-cols-2' : 'grid gap-8'

	return (
		<section>
			<BlockHeading title={block.title} />
			<div className={gridClassName}>
				{block.columns?.map((column) => (
					<div key={column.id}>
						<GuidelineImage
							image={column.image}
							alt={column.heading || ''}
							backgroundColor={column.imageBackgroundColor}
							scale={column.imageScale}
							className="mb-4 aspect-4/3 p-6"
						/>
						{column.heading && <h3 className="mb-4 font-semibold">{column.heading}</h3>}
						{column.body && (
							<RichText
								data={column.body}
								className="space-y-4 leading-7 tracking-normal"
							/>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
