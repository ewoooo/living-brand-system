import type { ReactNode } from 'react'
import type { CardData } from '../component'
import CiLockupDisplay from './dynamics/ci-lockup/component'
import CiLockupHeroDisplay from './dynamics/ci-lockup-hero/component'
import ClearspaceOverlayDisplay from './dynamics/clearspace-overlay/component'
import ClearspaceViewerDisplay from './dynamics/clearspace-viewer/component'
import HdColorPaletteDisplay from './dynamics/hd-color-palette/component'
import IconGridDisplay from './dynamics/icon-grid/component'
import LayoutGridDisplay from './dynamics/layout-grid/component'
import LayoutGridOverlayDisplay from './dynamics/layout-grid-overlay/component'
import LogoBgPickerDisplay from './dynamics/logo-bg-picker/component'
import LogoColorVariantDisplay from './dynamics/logo-color-variant/component'
import LogoDisplayDisplay from './dynamics/logo-display/component'
import LogoOnBackgroundDisplay from './dynamics/logo-on-background/component'
import PresetPanelDisplay from './dynamics/preset-panel/component'
import StemClearSpaceDisplay from './dynamics/stem-clear-space/component'
import TypeHierarchyDisplay from './dynamics/type-hierarchy/component'
import TypeLanguageDisplay from './dynamics/type-language/component'
import TypeScrambleDisplay from './dynamics/type-scramble/component'
import TypeSpecimenDisplay from './dynamics/type-specimen/component'
import TypeWeightDisplay from './dynamics/type-weight/component'
import type { DisplayId } from './registry'
import StaticDisplayDisplay from './static/component'

export type DisplayData = NonNullable<CardData['display']>[number]
type Row<K extends DisplayId> = Extract<DisplayData, { blockType: K }>
type DisplayComponent<K extends DisplayId> = (props: {
	display: Row<K>
	alt?: string
}) => ReactNode | Promise<ReactNode>

/**
 * 디스플레이 렌더 맵 — id → 폴더의 기본 export 컴포넌트. 컴포넌트는 자기 행(`display`) 하나를 받으므로 여기서
 * props를 풀지 않는다. id가 빠지면 typecheck가 잡는다. `registry.ts`와 파일을 가르는 이유는 그쪽을
 * payload.config가 Node에서 읽기 때문이다.
 */
export const DISPLAY_COMPONENTS = {
	staticDisplay: StaticDisplayDisplay,
	ciLockupHeroWidget: CiLockupHeroDisplay,
	clearspaceOverlayWidget: ClearspaceOverlayDisplay,
	logoBgPickerWidget: LogoBgPickerDisplay,
	logoDisplayWidget: LogoDisplayDisplay,
	typeScrambleWidget: TypeScrambleDisplay,
	typeWeightWidget: TypeWeightDisplay,
	typeSpecimenWidget: TypeSpecimenDisplay,
	layoutGridOverlayWidget: LayoutGridOverlayDisplay,
	ciLockupWidget: CiLockupDisplay,
	clearspaceViewerWidget: ClearspaceViewerDisplay,
	layoutGridWidget: LayoutGridDisplay,
	presetPanelDisplay: PresetPanelDisplay,
	hdColorPaletteWidget: HdColorPaletteDisplay,
	iconGridWidget: IconGridDisplay,
	stemClearSpaceWidget: StemClearSpaceDisplay,
	logoColorVariantWidget: LogoColorVariantDisplay,
	logoOnBgWidget: LogoOnBackgroundDisplay,
	typeHierarchyWidget: TypeHierarchyDisplay,
	typeLanguageWidget: TypeLanguageDisplay,
} satisfies { [K in DisplayId]: DisplayComponent<K> }

export function renderDisplay(display: DisplayData, context: { alt?: string } = {}): ReactNode {
	const Component = DISPLAY_COMPONENTS[display.blockType] as DisplayComponent<DisplayId>
	return <Component display={display as never} alt={context.alt} />
}
