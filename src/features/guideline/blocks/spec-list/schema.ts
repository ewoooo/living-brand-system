import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// key-value 규격 목록. 타이포·그리드처럼 짧은 정량/정성 스펙을 그룹 카드로 구조화한다.
export const SpecListBlock: Block = {
	slug: 'specList',
	interfaceName: 'SpecListBlock',
	labels: { singular: '스펙 목록', plural: '스펙 목록' },
	fields: [
		{
			name: 'groups',
			type: 'array',
			minRows: 1,
			labels: { singular: '스펙 그룹', plural: '스펙 그룹' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{
					name: 'specs',
					type: 'array',
					minRows: 1,
					labels: { singular: '규격', plural: '규격' },
					fields: [
						{ name: 'key', type: 'text', required: true },
						{ name: 'value', type: 'text', required: true },
					],
				},
			],
		},
		...baseBlockFields(),
	],
}
