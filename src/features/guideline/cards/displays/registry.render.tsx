import type { ReactNode } from 'react'
import { type GuidelineLeaf, renderLeaf } from '@/features/guideline/leaves/render-leaf'
import type { CardData } from '../component'
import type { DisplayId } from './registry'
import { StaticDisplay } from './static/component'

type DisplayData = NonNullable<CardData['display']>[number]
type DisplayRenderer = (display: DisplayData, context: { alt?: string }) => ReactNode

/**
 * 디스플레이 렌더 — `registry.ts`의 항목을 같은 id로 갈라 그린다. 컴포넌트를 레지스트리 항목에 직접
 * 싣지 않는 이유는 그 모듈을 payload.config가 Node에서 읽기 때문이다. id가 빠지면 typecheck가 잡는다.
 *
 * 위젯은 지금 leaf 렌더러에 위임한다 — 같은 Block 객체를 쓰므로 타입이 같다. 위젯 폴더가 이곳으로
 * 이관되면 항목마다 자기 컴포넌트를 갖고 위임은 사라진다.
 */
const widget: DisplayRenderer = (display) => renderLeaf(display as GuidelineLeaf)

export const DISPLAY_RENDERERS: Record<DisplayId, DisplayRenderer> = {
	staticDisplay: (display, { alt }) =>
		display.blockType === 'staticDisplay' ? (
			<StaticDisplay display={display} alt={alt} />
		) : null,
	ciLockupHeroWidget: widget,
	clearspaceOverlayWidget: widget,
	logoBgPickerWidget: widget,
	logoDisplayWidget: widget,
	typeScrambleWidget: widget,
	typeWeightWidget: widget,
	typeSpecimenWidget: widget,
	layoutGridOverlayWidget: widget,
}

export function renderDisplay(display: DisplayData, context: { alt?: string } = {}): ReactNode {
	return DISPLAY_RENDERERS[display.blockType](display, context)
}
