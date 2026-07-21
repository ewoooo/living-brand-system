import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 레이아웃 그리드 규격. 컬럼 수·거터·마진 수치를 evidence로 보존하고 오버레이로 시각화한다.
export const LayoutGridBlock: Block = {
	slug: 'layoutGrid',
	interfaceName: 'LayoutGridBlock',
	labels: { singular: '레이아웃 그리드', plural: '레이아웃 그리드' },
	fields: [
		{
			name: 'accent',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '컬럼 오버레이 강조색입니다. 비우면 중립색을 사용합니다.' },
		},
		{
			name: 'variants',
			type: 'array',
			minRows: 1,
			labels: { singular: '그리드 규격', plural: '그리드 규격' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{
					type: 'row',
					fields: [
						{ name: 'columns', type: 'number', required: true, min: 1, max: 24 },
						{
							name: 'gutter',
							type: 'text',
							admin: { description: "CSS 길이 문자열입니다. 예: '24px'." },
						},
						{
							name: 'margin',
							type: 'text',
							admin: { description: "CSS 길이 문자열입니다. 예: '64px'." },
						},
					],
				},
			],
		},
		...baseBlockFields(),
	],
}

export default LayoutGridBlock
