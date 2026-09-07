import type { ReactNode } from 'react'
import { CiLockupWidget } from '@/features/guideline/widgets/ci-lockup/component'
import { CiLockupHeroWidget } from '@/features/guideline/widgets/ci-lockup-hero/component'
import { ClearspaceOverlayWidget } from '@/features/guideline/widgets/clearspace-overlay/component'
import { ClearspaceViewerWidget } from '@/features/guideline/widgets/clearspace-viewer/component'
import { DoDontWidget } from '@/features/guideline/widgets/do-dont/component'
import { HdColorPaletteWidget } from '@/features/guideline/widgets/hd-color-palette/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoBgPickerWidget } from '@/features/guideline/widgets/logo-bg-picker/component'
import { LogoColorVariantWidget } from '@/features/guideline/widgets/logo-color-variant/component'
import { LogoDisplayWidget } from '@/features/guideline/widgets/logo-display/component'
import { LogoOnBackgroundWidget } from '@/features/guideline/widgets/logo-on-background/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeHierarchyWidget } from '@/features/guideline/widgets/type-hierarchy/component'
import { TypeLanguageWidget } from '@/features/guideline/widgets/type-language/component'
import { TypeScrambleWidget } from '@/features/guideline/widgets/type-scramble/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'
import { TypeWeightWidget } from '@/features/guideline/widgets/type-weight/component'
import type { SectionBlock } from '@/payload-types'

export type GuidelineLeaf = NonNullable<SectionBlock['children']>[number]

/**
 * leaf 하나를 그린다 — 이미지는 원본 비율로, 위젯은 자기 컴포넌트로. 새 위젯은 여기 분기를 더한다(docs/11 §3).
 * 위젯은 전부 인스턴스 입력 없이 자족 렌더(brand 컬렉션·폰트를 스스로 조회)이거나 자기 필드만 받는다.
 */
export function renderLeaf(leaf: GuidelineLeaf): ReactNode {
	switch (leaf.blockType) {
		case 'image': {
			const image = typeof leaf.image === 'object' ? leaf.image : null
			if (!image?.url) return null
			return (
				// biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용.
				<img
					src={image.url}
					alt={image.alt ?? image.name ?? ''}
					className="block h-auto w-full"
				/>
			)
		}
		case 'clearspaceOverlayWidget':
			return (
				<ClearspaceOverlayWidget
					logoLayer={leaf.logoLayer}
					gridLayer={leaf.gridLayer}
					scalePercent={leaf.scalePercent}
				/>
			)
		case 'clearspaceViewerWidget':
			return (
				<ClearspaceViewerWidget
					horizontalLogo={leaf.horizontalLogo}
					horizontalGrid={leaf.horizontalGrid}
					horizontalMinHeightPx={leaf.horizontalMinHeightPx}
					verticalLogo={leaf.verticalLogo}
					verticalGrid={leaf.verticalGrid}
					verticalMinHeightPx={leaf.verticalMinHeightPx}
				/>
			)
		case 'ciLockupWidget':
			// 🔑 축마다의 고정값을 그대로 넘긴다 — **알약에서 뺀 축에만** 적용된다(`view.tsx`의 `pick`).
			//    그래서 한 섹션에 판을 여럿 두고 꼴·표현만 다르게 고정할 수 있다(정본 지면 구성).
			return (
				<CiLockupWidget
					fixed={{
						h: leaf.h,
						subsidiaryOn: leaf.subsidiaryOn,
						subsidiary: leaf.subsidiary,
						branchOn: leaf.branchOn,
						branch: leaf.branch,
						form: leaf.form,
						language: leaf.language,
						colorType: leaf.colorType,
						mono: leaf.mono,
						clearSpace: leaf.clearSpace,
						measured: leaf.measured,
						heightControl: leaf.heightControl,
						hiddenControls: leaf.hiddenControls,
					}}
				/>
			)
		case 'ciLockupHeroWidget':
			return <CiLockupHeroWidget source={leaf.source} h={leaf.h} />
		case 'iconGridWidget':
			return <IconGridWidget />
		case 'stemClearSpaceWidget':
			return <StemClearSpaceWidget />
		case 'hdColorPaletteWidget':
			return <HdColorPaletteWidget groups={leaf.groups} layout={leaf.layout} />
		case 'doDontWidget':
			return (
				<DoDontWidget
					imageRatio={leaf.imageRatio}
					columns={leaf.columns}
					itemLabel={leaf.itemLabel}
					logo={leaf.logo}
					examples={leaf.examples}
				/>
			)
		case 'layoutGridWidget':
			return (
				<LayoutGridWidget
					sample={leaf.sample}
					caption={leaf.caption}
					guides={leaf.guides}
					marginPct={leaf.marginPct}
					gutterX={leaf.gutterX}
					gutterY={leaf.gutterY}
				/>
			)
		case 'layoutGridOverlayWidget':
			return <LayoutGridOverlayWidget />
		case 'logoColorVariantWidget':
			return <LogoColorVariantWidget logo={leaf.logo} />
		case 'logoBgPickerWidget':
			return <LogoBgPickerWidget group={leaf.group} logo={leaf.logo} />
		case 'logoDisplayWidget':
			return (
				<LogoDisplayWidget
					logo={leaf.logo}
					width={leaf.width}
					height={leaf.height}
					padding={leaf.padding}
				/>
			)
		case 'logoOnBgWidget':
			return (
				<LogoOnBackgroundWidget group={leaf.group} logo={leaf.logo} column={leaf.column} />
			)
		case 'typeHierarchyWidget':
			return <TypeHierarchyWidget language={leaf.language} />
		case 'typeLanguageWidget':
			return (
				<TypeLanguageWidget initialLanguage={leaf.initialLanguage} layout={leaf.layout} />
			)
		case 'typeScrambleWidget':
			return (
				<TypeScrambleWidget
					text={leaf.text}
					fontSize={leaf.fontSize}
					panelHeight={leaf.panelHeight}
					color={leaf.color}
					background={leaf.background}
					weight={leaf.weight}
				/>
			)
		case 'typeWeightWidget':
			return (
				<TypeWeightWidget
					layout={leaf.layout}
					language={leaf.language}
					initialWeight={leaf.initialWeight}
				/>
			)
		case 'typeSpecimenWidget':
			return <TypeSpecimenWidget />
		default:
			return null
	}
}
