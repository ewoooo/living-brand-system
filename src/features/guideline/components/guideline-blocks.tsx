import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import type { GuidelineBlock } from '../blocks/types'
import { guidelineBlockRenderers } from '../catalog/renderer.generated'

function renderBlock(block: GuidelineBlock): ReactNode {
	const renderer = guidelineBlockRenderers[block.blockType]
	return renderer(block as never)
}

// 🔴 간격을 부모의 `gap`이 아니라 **자식의 위쪽 여백**으로 준다. 한 목록 안에 두 리듬이 섞이기
//    때문이다 — 꼭지(section) 사이는 288, 그 밖의 블록 사이는 32(Figma 61:3376의 Article 스택).
//    gap 하나로는 표현할 수 없고, 종류별로 배열을 갈라 그리면 admin이 섞어 넣은 순서가 뒤집힌다.
const spacingClassName: Record<GuidelineBlock['blockType'], string> = {
	section: '[&:not(:first-child)]:mt-72',
	block: '[&:not(:first-child)]:mt-8',
	callout: '[&:not(:first-child)]:mt-8',
	contentColumns: '[&:not(:first-child)]:mt-8',
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
		<div className="flex flex-col">
			{blocks?.map((block) => {
				const content = renderBlock(block)

				return (
					<div
						key={block.id}
						className={spacingClassName[block.blockType]}
						data-better-editor-id={betterEditor ? block.id : undefined}
					>
						{content}
					</div>
				)
			})}
		</div>
	)
}
