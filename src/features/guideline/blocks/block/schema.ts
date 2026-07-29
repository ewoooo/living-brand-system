import type { Block } from 'payload'
import { ImageLeaf } from '@/features/guideline/leaves/image/schema'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/schema'
import { baseBlockFields } from '../shared/fields'

// page 바로 하위의 레이아웃 컨테이너. widget(leaf)들을 품고 배치(width·arrangement·columns)를 소유한다.
// 🔴 rules는 컨테이너(Block)에만 = provenance 불변식(collectGuidelineCheckSources가 block.rules를 훑음).
// dbName 짧게(blk)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유.
export const LayoutBlock: Block = {
	slug: 'block',
	dbName: 'blk',
	interfaceName: 'LayoutBlock',
	labels: { singular: '블록', plural: '블록' },
	fields: [
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
			// ponytail: 지금은 grid만 렌더 구현. carousel/featured/masonry는 세부 명세 대기(자리만).
			admin: { description: '위젯 배치 방식입니다. 현재 grid만 구현, 나머지는 예정.' },
		},
		{
			name: 'columns',
			type: 'number',
			defaultValue: 2,
			min: 1,
			max: 4,
			admin: { description: 'grid 열 수입니다(행은 위젯 개수로 자동).' },
		},
		{
			name: 'children',
			type: 'blocks',
			// leaf = Image | Widget (형제 위계). Text/Shape/Link는 추후.
			blocks: [ImageLeaf, ColorPaletteWidget],
			admin: { description: '이 블록이 품는 leaf(이미지·위젯)들입니다.' },
		},
		...baseBlockFields(),
	],
}

export default LayoutBlock
