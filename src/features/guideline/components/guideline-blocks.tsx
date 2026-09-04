import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { SECTION_STACK } from '../blocks/shared/rhythm'
import type { GuidelineBlock } from '../blocks/types'
import { guidelineBlockRenderers } from '../catalog/renderer.generated'

function renderBlock(block: GuidelineBlock): ReactNode {
	const renderer = guidelineBlockRenderers[block.blockType]
	return renderer(block as never)
}

export function GuidelineBlocks({
	blocks,
	betterEditor = false,
}: {
	blocks: GuidelineDocument['blocks']
	betterEditor?: boolean
}) {
	return (
		// 랜드마크는 토픽 화면(`pages/guideline-topic.tsx`)의 <article> 하나가 갖는다 — 여기는 스택일 뿐이다.
		<div className={SECTION_STACK}>
			{blocks?.map((block) => (
				<div key={block.id} data-better-editor-id={betterEditor ? block.id : undefined}>
					{renderBlock(block)}
				</div>
			))}
		</div>
	)
}
