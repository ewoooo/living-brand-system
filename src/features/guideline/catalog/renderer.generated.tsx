// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { ReactNode } from 'react'
import BlockComponent from '../blocks/block/component'
import CalloutComponent from '../blocks/callout/component'
import ContentColumnsComponent from '../blocks/content-columns/component'
import SectionComponent from '../blocks/section/component'
import type { GuidelineBlock } from '../blocks/types'

type RendererMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => ReactNode
}

export const guidelineBlockRenderers = {
	contentColumns: (block) => <ContentColumnsComponent block={block} />,
	callout: (block) => <CalloutComponent block={block} />,
	block: (block) => <BlockComponent block={block} />,
	section: (block) => <SectionComponent block={block} />,
} satisfies RendererMap
