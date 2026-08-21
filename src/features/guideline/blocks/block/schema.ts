import type { Block } from 'payload'
import { ImageLeaf } from '@/features/guideline/leaves/image/schema'
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
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { backgroundToneField, baseBlockFields } from '../shared/fields'

// page 바로 하위의 레이아웃 컨테이너. widget/image(leaf)들을 품고 배치(width·arrangement·columns)를 소유한다.
// 🔴 rules는 컨테이너(Block)에만 = provenance 불변식(collectGuidelineCheckSources가 block.rules를 훑음).
// dbName 짧게(blk)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유.
// 제목/본문 네이밍은 image-grid 선례(title=text, description=richText) 따름.
export const LayoutBlock: Block = {
	slug: 'block',
	dbName: 'blk',
	interfaceName: 'LayoutBlock',
	labels: { singular: '블록', plural: '블록' },
	fields: [
		{
			name: 'title',
			type: 'text',
			localized: true,
			admin: { description: '블록 상단에 표시할 선택 제목입니다.' },
		},
		{
			name: 'description',
			type: 'richText',
			localized: true,
			admin: { description: '제목 아래에 표시할 선택 본문입니다.' },
		},
		{
			name: 'width',
			type: 'select',
			defaultValue: 'padded',
			enumName: 'enum_block_width',
			options: [
				{ label: '중간폭', value: 'padded' },
				{ label: '전체폭', value: 'full' },
			],
			admin: { description: '컨테이너 폭입니다. 중간폭=max-w, 전체폭=main 전체.' },
		},
		// 배경색 = block 소관(위젯은 배경 안 가짐). 전체폭 배경 + 자식 레이아웃(arrangement) 배경 별도.
		{
			name: 'background',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '블록 전체(전체 폭) 배경색입니다. 비우면 기본.' },
		},
		backgroundToneField(),
		{
			name: 'innerBackground',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: {
				description: '자식 레이아웃(그리드/캐러셀 등) 영역 배경색입니다. 비우면 없음.',
			},
		},
		{
			name: 'arrangement',
			type: 'select',
			defaultValue: 'grid',
			enumName: 'enum_block_arrangement',
			options: [
				{ label: '그리드', value: 'grid' },
				{ label: '캐러셀', value: 'carousel' },
				{ label: '피처드 — 첫 칸이 윗줄 전체', value: 'featured' },
				{ label: '피처드 — 첫 칸이 왼쪽 열 전체', value: 'featuredSide' },
				{ label: '메이슨리', value: 'masonry' },
			],
			admin: {
				description:
					'위젯 배치 방식입니다. 피처드 둘은 첫 자식만 크게 두고 나머지를 남은 칸에 흘립니다 — 윗줄이냐 왼쪽 열이냐만 다릅니다.',
			},
		},
		{
			name: 'columns',
			type: 'number',
			defaultValue: 2,
			min: 1,
			max: 4,
			admin: { description: 'grid 열 수입니다(행은 자식 개수로 자동).' },
		},
		{
			name: 'gap',
			type: 'select',
			defaultValue: 'default',
			enumName: 'enum_block_gap',
			options: [
				{ label: '표준(간격 있음)', value: 'default' },
				{ label: '맞붙임(선 하나로)', value: 'none' },
			],
			admin: {
				description:
					'맞붙이면 셀 사이가 1px 선 하나만 남습니다. 셀마다 테두리를 두면 맞닿은 자리가 2px이 되므로 선은 그리드가 그립니다. grid 배치에만 적용됩니다.',
			},
		},
		{
			name: 'aspectRatio',
			type: 'select',
			defaultValue: '1:1',
			enumName: 'enum_block_aspect_ratio',
			options: [...IMAGE_RATIO_OPTIONS],
			admin: {
				description: '이미지 셀 비율(모든 이미지 균일). masonry에선 무시하고 원본 비율.',
			},
		},
		{
			name: 'children',
			type: 'blocks',
			// leaf = Image(정적) | Widget(인터랙티브) 형제 위계. Text/Shape/Link는 추후.
			blocks: [
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
			],
			admin: { description: '이 블록이 품는 leaf(이미지·위젯)들입니다.' },
		},
		...baseBlockFields(),
	],
}

export default LayoutBlock
