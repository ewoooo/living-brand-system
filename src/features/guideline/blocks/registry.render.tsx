import type { ReactNode } from 'react'
import { blockEntry, fixedTitle } from './registry'
import { SectionBlock } from './section/component'
import { CardBlock } from './shared/card-block'
import type { GuidelineBlock } from './types'

/**
 * 블록 렌더 — `registry.ts`의 항목을 같은 id로 갈라 그린다. 렌더도 둘뿐이다: section과 카드 블록.
 * 컴포넌트를 레지스트리 항목에 직접 싣지 않는 이유는 그 모듈을 payload.config가 Node에서 읽기 때문이다.
 */
export function renderBlock(block: GuidelineBlock): ReactNode {
	if (block.blockType === 'section') return <SectionBlock block={block} />
	const entry = blockEntry(block.blockType)
	return <CardBlock block={block} title={fixedTitle(entry) ?? block.title} />
}
