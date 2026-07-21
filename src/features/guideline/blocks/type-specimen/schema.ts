import type { Block } from 'payload'
import { baseBlockFields, typefaceField } from '../shared/fields'

// 라이브 타입 스페시먼. tier별 초기 샘플 문구만 저장하고 타이핑·정렬·행간 상태는 저장하지 않는다.
export const TypeSpecimenBlock: Block = {
	slug: 'typeSpecimen',
	interfaceName: 'TypeSpecimenBlock',
	labels: { singular: '타입 스페시먼', plural: '타입 스페시먼' },
	fields: [
		typefaceField(),
		{
			name: 'samples',
			type: 'group',
			admin: {
				description: 'tier별 초기 샘플 문구입니다. 비우면 중립 기본 문구를 사용합니다.',
			},
			fields: [
				{ name: 'word', type: 'text', localized: true },
				{ name: 'sentence', type: 'text', localized: true },
				{ name: 'paragraph', type: 'textarea', localized: true },
			],
		},
		...baseBlockFields(),
	],
}
