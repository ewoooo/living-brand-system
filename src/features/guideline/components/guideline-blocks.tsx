import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps } from 'react'
import type { GuidelinePage } from '@/payload-types'

type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]
type RichTextData = ComponentProps<typeof RichText>['data']
type ImageValue = {
	url?: string | null
	alt?: string | null
	name?: string | null
}

export function GuidelineBlocks({ blocks }: { blocks: GuidelinePage['blocks'] }) {
	return (
		<div className="flex flex-col gap-12">
			{blocks?.map((block) => (
				<GuidelineBlockView key={block.id} block={block} />
			))}
		</div>
	)
}

function GuidelineBlockView({ block }: { block: GuidelineBlock }) {
	switch (block.blockType) {
		case 'columnUnit':
			return <ColumnUnitBlock block={block} />
		case 'mediaShowcase':
			return <MediaShowcaseBlock block={block} />
		case 'exampleGrid':
			return <ExampleGridBlock block={block} />
		default:
			return null
	}
}

function RichTextView({ data }: { data: RichTextData }) {
	return <RichText data={data} className="space-y-4 leading-7 tracking-normal" />
}

function ColumnUnitBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'columnUnit' }>
}) {
	return (
		<section>
			{block.title && <h2 className="mb-6 font-semibold text-xl">{block.title}</h2>}
			<div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
				{block.columns?.map((column) => {
					const image = getImage(column.image)

					return (
						<div key={column.id}>
							<GuidelineImage
								image={image}
								alt={column.heading || ''}
								className="mb-4 aspect-[4/3] p-6"
							/>
							{column.heading && (
								<h3 className="mb-4 font-semibold">{column.heading}</h3>
							)}
							{column.body && <RichTextView data={column.body} />}
						</div>
					)
				})}
			</div>
		</section>
	)
}

function MediaShowcaseBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>
}) {
	const image = getImage(block.image)

	return (
		<section className="grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr]">
			<div>
				{block.title && <h2 className="mb-4 font-semibold text-xl">{block.title}</h2>}
				{block.body && <RichTextView data={block.body} />}
			</div>
			<GuidelineImage image={image} className="min-h-80 p-8" />
		</section>
	)
}

function ExampleGridBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'exampleGrid' }>
}) {
	const columnClass =
		{
			'2': 'xl:grid-cols-2',
			'3': 'xl:grid-cols-3',
			'4': 'xl:grid-cols-4',
		}[block.columns || '2'] || 'xl:grid-cols-2'

	return (
		<section>
			{block.title && <h2 className="mb-6 font-semibold text-xl">{block.title}</h2>}
			<div className={`grid gap-5 md:grid-cols-2 ${columnClass}`}>
				{block.items?.map((item) => {
					const image = getImage(item.image)

					return (
						<figure key={item.id}>
							{item.title && (
								<figcaption className="mb-3 font-medium">{item.title}</figcaption>
							)}
							<GuidelineImage
								image={image}
								alt={item.title || ''}
								className="aspect-[4/3] p-6"
							/>
							{item.caption && (
								<p className="mt-3 text-muted-foreground text-sm">{item.caption}</p>
							)}
						</figure>
					)
				})}
			</div>
		</section>
	)
}

function GuidelineImage({
	image,
	alt = '',
	className,
}: {
	image: ImageValue | null
	alt?: string
	className?: string
}) {
	if (!image?.url) {
		return null
	}

	return (
		<div className={`flex items-center justify-center bg-muted/40 ${className || ''}`}>
			{/* biome-ignore lint/performance/noImgElement: Payload upload URLs may be local or S3. */}
			<img
				src={image.url}
				alt={image.alt || image.name || alt}
				className="max-h-full max-w-full"
			/>
		</div>
	)
}

function getImage(value: unknown): ImageValue | null {
	return value && typeof value === 'object' ? (value as ImageValue) : null
}
