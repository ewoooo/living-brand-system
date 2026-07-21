import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { CalloutBlock } from './callout/component'
import { CarouselBlock } from './carousel/component'
import { ColorPaletteBlock } from './color-palette/component'
import { ContentColumnsBlock } from './content-columns/component'
import { DoDontBlock } from './do-dont/component'
import { GlyphGridBlock } from './glyph-grid/component'
import { LayoutGridBlock } from './layout-grid/component'
import { MediaShowcaseBlock } from './media-showcase/component'
import { SignatureShowcaseBlock } from './signature-showcase/component'
import { SpecListBlock } from './spec-list/component'
import { TypeScaleBlock } from './type-scale/component'
import { TypeSpecimenBlock } from './type-specimen/component'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type RendererMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => ReactNode
}

const blockRenderers = {
	contentColumns: (block) => <ContentColumnsBlock block={block} />,
	carousel: (block) => <CarouselBlock block={block} />,
	mediaShowcase: (block) => <MediaShowcaseBlock block={block} />,
	colorPalette: (block) => <ColorPaletteBlock block={block} />,
	doDont: (block) => <DoDontBlock block={block} />,
	callout: (block) => <CalloutBlock block={block} />,
	specList: (block) => <SpecListBlock block={block} />,
	signatureShowcase: (block) => <SignatureShowcaseBlock block={block} />,
	typeSpecimen: (block) => <TypeSpecimenBlock block={block} />,
	typeScale: (block) => <TypeScaleBlock block={block} />,
	layoutGrid: (block) => <LayoutGridBlock block={block} />,
	glyphGrid: (block) => <GlyphGridBlock block={block} />,
} satisfies RendererMap

function renderBlock(block: GuidelineBlock): ReactNode {
	const renderer = blockRenderers[block.blockType]
	return renderer ? renderer(block as never) : null
}

export function GuidelineBlocks({
	blocks,
	betterEditor = false,
}: {
	blocks: GuidelineDocument['blocks']
	betterEditor?: boolean
}) {
	return (
		<article className="flex flex-col">
			{blocks?.map((block) => {
				const content = renderBlock(block)
				if (!content) return null

				return (
					<div key={block.id} data-better-editor-id={betterEditor ? block.id : undefined}>
						{content}
					</div>
				)
			})}
		</article>
	)
}
