import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 아이콘 그리드 — Essenherb 아이콘 40종을 전시하는 위젯형 블록.
// 뷰어는 태그 필터·색상 반전·랜덤 섞기만 조작한다. 아래 필드는 manager가 admin에서 설정하는 값이다.
export const IconGridBlock: Block = {
	slug: 'iconGrid',
	interfaceName: 'IconGridBlock',
	labels: { singular: '아이콘 그리드', plural: '아이콘 그리드' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'colored',
			type: 'checkbox',
			defaultValue: false,
			admin: { description: '켜면 컬러 팔레트, 끄면 흑백(Shape)으로 표시합니다.' },
		},
		{
			type: 'row',
			fields: [
				{
					name: 'cellHeightPct',
					type: 'number',
					defaultValue: 100,
					min: 1,
					admin: { width: '33.33%', description: '셀 높이(셀 폭 대비 %)입니다.' },
				},
				{
					name: 'svgSizePct',
					type: 'number',
					defaultValue: 70,
					min: 1,
					admin: { width: '33.33%', description: '아이콘 크기(셀 폭 대비 %)입니다.' },
				},
				{
					name: 'svgOffsetPct',
					type: 'number',
					defaultValue: 0,
					admin: {
						width: '33.33%',
						description: '아이콘 수직 이동(셀 폭 대비 %)입니다.',
					},
				},
			],
		},
		...baseBlockFields(),
	],
}

export default IconGridBlock
