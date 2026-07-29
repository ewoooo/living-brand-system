import type { Block } from 'payload'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/schema'
import { baseBlockFields } from '../shared/fields'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용 컨테이너. 제거 시 이 폴더(blocks/block-spike) 통째 삭제.
//
// Block이 Widget(중첩 blocks 필드)을 호스팅하는 배관을 검증한다.
// - rules는 컨테이너(Block)에만 둔다 = Rule provenance 불변식(collectGuidelineCheckSources가 block.rules를 훑음).
// - widgets = 중첩 blocks 필드. 자식 위젯 종류는 widgets/에서 import(top-level 카탈로그 미등록).
// - dbName 짧게(spk)로 중첩 테이블명 63자 방어.
export const BlockSpikeBlock: Block = {
	slug: 'blockSpike',
	dbName: 'spk',
	interfaceName: 'BlockSpikeBlock',
	labels: { singular: '[임시] 블록 스파이크', plural: '[임시] 블록 스파이크' },
	fields: [
		{
			name: 'columns',
			type: 'number',
			defaultValue: 1,
			min: 1,
			max: 3,
			admin: { description: '위젯 배치 열 수입니다.' },
		},
		{
			name: 'widgets',
			type: 'blocks',
			blocks: [ColorPaletteWidget],
			admin: { description: '이 블록이 호스팅할 위젯들입니다.' },
		},
		...baseBlockFields(),
	],
}

export default BlockSpikeBlock
