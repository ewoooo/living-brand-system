import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { baseBlockFields } from '../shared/fields'

// Do/Don't 그리드. 그룹은 같은 주제의 권장·금지 예시를 묶는다.
export const DoDontBlock: Block = {
	slug: 'doDont',
	interfaceName: 'DoDontBlock',
	labels: { singular: 'Do/Don’t', plural: 'Do/Don’t' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			type: 'row',
			fields: [
				{
					name: 'imageRatio',
					type: 'select',
					defaultValue: '4:3',
					options: [...IMAGE_RATIO_OPTIONS],
					admin: { width: '33.33%', description: '예시 이미지의 표시 비율입니다.' },
				},
				{
					name: 'groupLayout',
					type: 'select',
					defaultValue: 'vertical',
					options: [
						{ label: '세로 스택', value: 'vertical' },
						{ label: '가로 스택', value: 'horizontal' },
					],
					admin: {
						width: '33.33%',
						description: '가로 스택은 넓은 화면에서 그룹을 나란히 배치합니다.',
					},
				},
				{
					name: 'exampleColumns',
					type: 'select',
					defaultValue: '3',
					options: [
						{ label: '2열', value: '2' },
						{ label: '3열', value: '3' },
						{ label: '4열', value: '4' },
					],
					admin: {
						width: '33.33%',
						description:
							'세로 스택의 그룹 내부 예시를 넓은 화면에서 배치할 열 수입니다.',
					},
				},
			],
		},
		{
			name: 'groups',
			type: 'array',
			minRows: 1,
			admin: { description: '카테고리 단위 예시 그룹입니다.' },
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'category',
							type: 'text',
							localized: true,
							admin: { width: '50%' },
						},
						{
							name: 'kind',
							type: 'select',
							required: true,
							defaultValue: 'dont',
							options: [
								{ label: 'Do (권장)', value: 'do' },
								{ label: 'OK (허용)', value: 'ok' },
								{ label: "Don't (금지)", value: 'dont' },
							],
							admin: { width: '50%' },
						},
					],
				},
				{
					name: 'description',
					type: 'textarea',
					localized: true,
					admin: {
						description:
							'그룹 전체에 적용되는 설명입니다. 예시별 caption 대신 사용할 수 있습니다.',
					},
				},
				{
					name: 'examples',
					type: 'array',
					minRows: 1,
					fields: [
						{ name: 'image', type: 'upload', relationTo: 'application-images' },
						{ name: 'caption', type: 'text', localized: true },
					],
				},
			],
		},
		...baseBlockFields(),
	],
}
