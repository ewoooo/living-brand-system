import type { ReactNode } from 'react'
import type { CardData } from '../component'
import { CiLockupWidget } from './dynamics/ci-lockup/component'
import { CiLockupHeroWidget } from './dynamics/ci-lockup-hero/component'
import { ClearspaceOverlayWidget } from './dynamics/clearspace-overlay/component'
import { ClearspaceViewerWidget } from './dynamics/clearspace-viewer/component'
import { DoDontWidget } from './dynamics/do-dont/component'
import { HdColorPaletteWidget } from './dynamics/hd-color-palette/component'
import { IconGridWidget } from './dynamics/icon-grid/component'
import { LayoutGridWidget } from './dynamics/layout-grid/component'
import { LayoutGridOverlayWidget } from './dynamics/layout-grid-overlay/component'
import { LogoBgPickerWidget } from './dynamics/logo-bg-picker/component'
import { LogoColorVariantWidget } from './dynamics/logo-color-variant/component'
import { LogoDisplayWidget } from './dynamics/logo-display/component'
import { LogoOnBackgroundWidget } from './dynamics/logo-on-background/component'
import { StemClearSpaceWidget } from './dynamics/stem-clear-space/component'
import { TypeHierarchyWidget } from './dynamics/type-hierarchy/component'
import { TypeLanguageWidget } from './dynamics/type-language/component'
import { TypeScrambleWidget } from './dynamics/type-scramble/component'
import { TypeSpecimenWidget } from './dynamics/type-specimen/component'
import { TypeWeightWidget } from './dynamics/type-weight/component'
import type { DisplayId } from './registry'
import { StaticDisplay } from './static/component'

export type DisplayData = NonNullable<CardData['display']>[number]
type Of<K extends DisplayId> = Extract<DisplayData, { blockType: K }>
type DisplayRenderer<K extends DisplayId> = (display: Of<K>, context: { alt?: string }) => ReactNode

/**
 * 디스플레이 렌더 — `registry.ts`의 항목을 같은 id로 갈라 그린다. id가 빠지면 typecheck가 잡는다.
 * 컴포넌트를 레지스트리 항목에 직접 싣지 않는 이유는 그 모듈을 payload.config가 Node에서 읽기 때문이다.
 *
 * 위젯은 전부 인스턴스 입력 없이 자족 렌더(brand 컬렉션·폰트를 스스로 조회)이거나 자기 필드만 받는다.
 * 🔴 렌더가 인스턴스 필드를 props로 넘기지 않으면 두 번째 판의 admin 값이 조용히 버려진다 — 에러도 경고도 없이
 *    「저장했는데 안 바뀐다」로 나타난다(docs/11 §5).
 */
export const DISPLAY_RENDERERS: { [K in DisplayId]: DisplayRenderer<K> } = {
	staticDisplay: (display, { alt }) => <StaticDisplay display={display} alt={alt} />,
	ciLockupHeroWidget: (d) => <CiLockupHeroWidget source={d.source} h={d.h} />,
	clearspaceOverlayWidget: (d) => (
		<ClearspaceOverlayWidget
			logoLayer={d.logoLayer}
			gridLayer={d.gridLayer}
			scalePercent={d.scalePercent}
		/>
	),
	logoBgPickerWidget: (d) => <LogoBgPickerWidget group={d.group} logo={d.logo} />,
	logoDisplayWidget: (d) => (
		<LogoDisplayWidget logo={d.logo} width={d.width} height={d.height} padding={d.padding} />
	),
	typeScrambleWidget: (d) => (
		<TypeScrambleWidget
			text={d.text}
			fontSize={d.fontSize}
			panelHeight={d.panelHeight}
			color={d.color}
			background={d.background}
			weight={d.weight}
		/>
	),
	typeWeightWidget: (d) => (
		<TypeWeightWidget layout={d.layout} language={d.language} initialWeight={d.initialWeight} />
	),
	typeSpecimenWidget: () => <TypeSpecimenWidget />,
	layoutGridOverlayWidget: () => <LayoutGridOverlayWidget />,
	// 🔑 축마다의 고정값을 그대로 넘긴다 — 알약에서 뺀 축에만 적용된다(`view.tsx`의 `pick`). 카드 안에서는
	//    컨트롤러 스코프가 없어 전부 고정값으로 그려진다(2026-09-07 결정 B).
	ciLockupWidget: (d) => (
		<CiLockupWidget
			fixed={{
				h: d.h,
				subsidiaryOn: d.subsidiaryOn,
				subsidiary: d.subsidiary,
				branchOn: d.branchOn,
				branch: d.branch,
				form: d.form,
				language: d.language,
				colorType: d.colorType,
				mono: d.mono,
				clearSpace: d.clearSpace,
				measured: d.measured,
				heightControl: d.heightControl,
				hiddenControls: d.hiddenControls,
			}}
		/>
	),
	clearspaceViewerWidget: (d) => (
		<ClearspaceViewerWidget
			horizontalLogo={d.horizontalLogo}
			horizontalGrid={d.horizontalGrid}
			horizontalMinHeightPx={d.horizontalMinHeightPx}
			verticalLogo={d.verticalLogo}
			verticalGrid={d.verticalGrid}
			verticalMinHeightPx={d.verticalMinHeightPx}
		/>
	),
	layoutGridWidget: (d) => (
		<LayoutGridWidget
			sample={d.sample}
			caption={d.caption}
			guides={d.guides}
			marginPct={d.marginPct}
			gutterX={d.gutterX}
			gutterY={d.gutterY}
		/>
	),
	doDontWidget: (d) => (
		<DoDontWidget
			imageRatio={d.imageRatio}
			columns={d.columns}
			itemLabel={d.itemLabel}
			logo={d.logo}
			examples={d.examples}
		/>
	),
	hdColorPaletteWidget: (d) => <HdColorPaletteWidget groups={d.groups} layout={d.layout} />,
	iconGridWidget: () => <IconGridWidget />,
	stemClearSpaceWidget: () => <StemClearSpaceWidget />,
	logoColorVariantWidget: (d) => <LogoColorVariantWidget logo={d.logo} />,
	logoOnBgWidget: (d) => (
		<LogoOnBackgroundWidget group={d.group} logo={d.logo} column={d.column} />
	),
	typeHierarchyWidget: (d) => <TypeHierarchyWidget language={d.language} />,
	typeLanguageWidget: (d) => (
		<TypeLanguageWidget initialLanguage={d.initialLanguage} layout={d.layout} />
	),
}

export function renderDisplay(display: DisplayData, context: { alt?: string } = {}): ReactNode {
	const render = DISPLAY_RENDERERS[display.blockType] as DisplayRenderer<DisplayId>
	return render(display as never, context)
}
