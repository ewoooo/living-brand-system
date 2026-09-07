import type { Block, Field } from 'payload'
import { CiLockupWidget } from '@/features/guideline/widgets/ci-lockup/schema'
import { CiLockupHeroWidget } from '@/features/guideline/widgets/ci-lockup-hero/schema'
import { ClearspaceOverlayWidget } from '@/features/guideline/widgets/clearspace-overlay/schema'
import { ClearspaceViewerWidget } from '@/features/guideline/widgets/clearspace-viewer/schema'
import { DoDontWidget } from '@/features/guideline/widgets/do-dont/schema'
import { HdColorPaletteWidget } from '@/features/guideline/widgets/hd-color-palette/schema'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/schema'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/schema'
import { LayoutGridControlsWidget } from '@/features/guideline/widgets/layout-grid-controls/schema'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/schema'
import { LogoBgPickerWidget } from '@/features/guideline/widgets/logo-bg-picker/schema'
import { LogoColorVariantWidget } from '@/features/guideline/widgets/logo-color-variant/schema'
import { LogoDisplayWidget } from '@/features/guideline/widgets/logo-display/schema'
import { LogoOnBackgroundWidget } from '@/features/guideline/widgets/logo-on-background/schema'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/schema'
import { TypeHierarchyWidget } from '@/features/guideline/widgets/type-hierarchy/schema'
import { TypeLanguageWidget } from '@/features/guideline/widgets/type-language/schema'
import { TypeScrambleWidget } from '@/features/guideline/widgets/type-scramble/schema'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/schema'
import { TypeWeightWidget } from '@/features/guideline/widgets/type-weight/schema'
import { ImageLeaf } from './image/schema'

/**
 * 섹션이 직접 품는 leaf — 이미지(정적)와 위젯(인터랙티브)의 형제 위계. 새 위젯은 이 배열에 넣는다(docs/11 §3).
 *
 * 🔴 payload.config가 Node에서 로드하는 모듈이다. react·이미지 import를 섞지 말 것.
 */
const LEAVES: Block[] = [
	ImageLeaf,
	CiLockupWidget,
	CiLockupHeroWidget,
	ClearspaceOverlayWidget,
	ClearspaceViewerWidget,
	DoDontWidget,
	HdColorPaletteWidget,
	IconGridWidget,
	StemClearSpaceWidget,
	LayoutGridWidget,
	LayoutGridControlsWidget,
	LayoutGridOverlayWidget,
	LogoColorVariantWidget,
	LogoBgPickerWidget,
	LogoDisplayWidget,
	LogoOnBackgroundWidget,
	TypeHierarchyWidget,
	TypeLanguageWidget,
	TypeScrambleWidget,
	TypeWeightWidget,
	TypeSpecimenWidget,
]

export const LEAF_SPANS = ['full', 'half', 'third'] as const
export type LeafSpan = (typeof LEAF_SPANS)[number]

/**
 * leaf의 폭. 옛 블록 층이 갖던 "열 수"를 leaf 하나하나가 대신 말한다(2026-09-04) — 그래서 줄바꿈이
 * 폭에서 나오고 행(블록)이라는 층이 필요 없다. 이름이 `width`가 아닌 이유: logo-display 위젯이 px 단위
 * `width` 필드를 이미 갖고 있다.
 */
function spanField(): Field {
	return {
		name: 'span',
		type: 'select',
		defaultValue: 'full',
		enumName: 'enum_leaf_span',
		options: [
			{ label: '전폭', value: 'full' },
			{ label: '절반', value: 'half' },
			{ label: '삼분', value: 'third' },
		],
		admin: { description: '이 leaf가 차지하는 폭입니다. 좁은 화면에서는 모두 전폭이 됩니다.' },
	}
}

/** 섹션 `children`에 들어가는 최종 스키마 — 각 leaf에 공통 `span` 필드를 붙인다. */
export const GUIDELINE_LEAVES: Block[] = LEAVES.map((leaf) => ({
	...leaf,
	fields: [...leaf.fields, spanField()],
}))
