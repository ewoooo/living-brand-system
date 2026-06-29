import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelinePage } from '@/payload-types'

type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]
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
		default:
			return null
	}
}

function ColumnUnitBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'columnUnit' }>
}) {
	const gridClassName =
		block.columns && block.columns.length > 1 ? 'grid gap-8 md:grid-cols-2' : 'grid gap-8'

	return (
		<section>
			{block.title && <h2 className="mb-6 font-semibold text-xl">{block.title}</h2>}
			<div className={gridClassName}>
				{block.columns?.map((column) => {
					const image = getImage(column.image)

					return (
						<div key={column.id}>
							<GuidelineImage
								image={image}
								alt={column.heading || ''}
								backgroundColor={column.imageBackgroundColor}
								scale={column.imageScale}
								className="mb-4 aspect-4/3 p-6"
							/>
							{column.heading && (
								<h3 className="mb-4 font-semibold">{column.heading}</h3>
							)}
							{column.body && (
								<RichText
									data={column.body}
									className="space-y-4 leading-7 tracking-normal"
								/>
							)}
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
		<section className="grid aspect-video place-items-center">
			<GuidelineImage
				image={image}
				backgroundColor={block.imageBackgroundColor}
				scale={block.imageScale}
				className="min-h-80 p-8 w-full"
			/>
		</section>
	)
}

function GuidelineImage({
	image,
	alt = '',
	backgroundColor,
	scale = '100',
	className,
}: {
	image: ImageValue | null
	alt?: string
	backgroundColor?: unknown
	scale?: string | null
	className?: string
}) {
	if (!image?.url) {
		return null
	}

	const backgroundColorHex = getColorHex(backgroundColor)

	return (
		<div
			className={`flex items-center justify-center ${className || ''}`}
			style={backgroundColorHex ? { backgroundColor: backgroundColorHex } : undefined}
		>
			{/* biome-ignore lint/performance/noImgElement: Payload upload URLs may be local or S3. */}
			<img
				src={image.url}
				alt={image.alt || image.name || alt}
				className="max-h-full max-w-full"
				style={{ width: `${scale || '100'}%` }}
			/>
		</div>
	)
}

function getImage(value: unknown): ImageValue | null {
	return value && typeof value === 'object' ? (value as ImageValue) : null
}

function getColorHex(value: unknown): string | null {
	if (!value || typeof value !== 'object' || !('hex' in value)) {
		return null
	}

	return typeof value.hex === 'string' ? value.hex : null
}
