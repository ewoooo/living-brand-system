import type { Block } from 'payload'
import { baseBlockFields, typefaceField } from '../shared/fields'

// 타입 스케일. 타입 토큰별 샘플과 수치 규격(size/line-height/weight)을 나열한다.
export const TypeScaleBlock: Block = {
	slug: 'typeScale',
	interfaceName: 'TypeScaleBlock',
	labels: { singular: '타입 스케일', plural: '타입 스케일' },
	fields: [
		typefaceField(),
		{
			name: 'items',
			type: 'array',
			minRows: 1,
			labels: { singular: '타입 토큰', plural: '타입 토큰' },
			fields: [
				{ name: 'name', type: 'text', required: true },
				{
					name: 'sample',
					type: 'text',
					localized: true,
					admin: { description: '비우면 중립 기본 문구를 사용합니다.' },
				},
				{
					type: 'row',
					fields: [
						{ name: 'sizePx', type: 'number', required: true, min: 1 },
						{ name: 'lineHeightPx', type: 'number', required: true, min: 1 },
						{ name: 'weight', type: 'number', required: true, min: 100, max: 1000 },
					],
				},
			],
		},
		...baseBlockFields(),
	],
}
