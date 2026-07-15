import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function ColumnUnitBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'columnUnit' }>
}) {
	const gridClassName =
		block.columns && block.columns.length > 1 ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'

	return (
		<section>
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
						{column.heading && (
							<h4 className="type-body-emphasized mb-4">{column.heading}</h4>
						)}
						{column.body && (
							<RichText
								data={column.body}
								className="type-body flex flex-col gap-4"
							/>
						)}
					</div>
				))}
			</div>
		</section>
	)
}
