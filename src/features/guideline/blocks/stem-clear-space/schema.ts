import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 줄기 기반 클리어스페이스(최소 여백 = N·A) 블록. A(줄기 두께)·위치는 admin에서 줄기를 클릭해 측정한
// 로고 폭 대비 비율(0~1)로 저장한다 — 표시 크기·해상도와 무관. N은 브랜드 규칙이라 author가 정한다.
export const StemClearSpaceBlock: Block = {
	slug: 'stemClearSpace',
	interfaceName: 'StemClearSpaceBlock',
	labels: { singular: '줄기 클리어스페이스', plural: '줄기 클리어스페이스' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			admin: { description: '여백 규정을 보여줄 로고입니다.' },
		},
		{
			// 로고 위 줄기를 클릭해 A(두께)·위치를 측정하고 아래 stemRatio·stemX에 기록하는 UI.
			name: 'stemPicker',
			type: 'ui',
			admin: { components: { Field: '/components/admin/StemPickerField' } },
		},
		{
			type: 'row',
			fields: [
				{
					name: 'stemRatio',
					type: 'number',
					min: 0,
					max: 1,
					defaultValue: 0.025,
					admin: { width: '33.33%', description: '줄기 두께 ÷ 로고 폭(0~1). 측정값.' },
				},
				{
					name: 'stemX',
					type: 'number',
					min: 0,
					max: 1,
					defaultValue: 0.29,
					admin: { width: '33.33%', description: '줄기 위치(로고 폭 대비 0~1). 측정값.' },
				},
				{
					name: 'multiplier',
					type: 'number',
					min: 1,
					max: 6,
					defaultValue: 3,
					admin: { width: '33.33%', description: '여백 배수 N (N·A).' },
				},
			],
		},
		...baseBlockFields(),
	],
}

export default StemClearSpaceBlock
