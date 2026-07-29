import type { Block } from 'payload'
import { ImageLeaf } from '@/features/guideline/leaves/image/schema'
import { CarouselWidget } from '@/features/guideline/widgets/carousel/schema'
import { ColorPairingWidget } from '@/features/guideline/widgets/color-pairing/schema'
import { ColorPairingRecommendationWidget } from '@/features/guideline/widgets/color-pairing-recommendation/schema'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/schema'
import { GlyphGridWidget } from '@/features/guideline/widgets/glyph-grid/schema'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/schema'
import { ImageGridWidget } from '@/features/guideline/widgets/image-grid/schema'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/schema'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/schema'
import { LogoGroupViewerWidget } from '@/features/guideline/widgets/logo-group-viewer/schema'
import { LogoViewerWidget } from '@/features/guideline/widgets/logo-viewer/schema'
import { MediaShowcaseWidget } from '@/features/guideline/widgets/media-showcase/schema'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/schema'
import { TypeScaleWidget } from '@/features/guideline/widgets/type-scale/schema'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/schema'
import { baseBlockFields } from '../shared/fields'

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
		{
			name: 'arrangement',
			type: 'select',
			defaultValue: 'grid',
			enumName: 'enum_block_arrangement',
			options: [
				{ label: '그리드', value: 'grid' },
				{ label: '캐러셀', value: 'carousel' },
				{ label: '피처드', value: 'featured' },
				{ label: '메이슨리', value: 'masonry' },
			],
			admin: { description: '위젯 배치 방식입니다. 현재 grid/carousel/masonry 구현.' },
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
			name: 'children',
			type: 'blocks',
			// leaf = Image(정적) | Widget(인터랙티브) 형제 위계. Text/Shape/Link는 추후.
			blocks: [
				ImageLeaf,
				ColorPaletteWidget,
				CarouselWidget,
				ColorPairingWidget,
				ColorPairingRecommendationWidget,
				GlyphGridWidget,
				IconGridWidget,
				ImageGridWidget,
				LayoutGridWidget,
				LayoutGridOverlayWidget,
				LogoGroupViewerWidget,
				LogoViewerWidget,
				MediaShowcaseWidget,
				StemClearSpaceWidget,
				TypeScaleWidget,
				TypeSpecimenWidget,
			],
			admin: { description: '이 블록이 품는 leaf(이미지·위젯)들입니다.' },
		},
		...baseBlockFields(),
	],
}

export default LayoutBlock
