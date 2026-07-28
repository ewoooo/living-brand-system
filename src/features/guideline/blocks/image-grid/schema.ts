import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { baseBlockFields } from '../shared/fields'

// 이미지 그리드 — columns×rows 고정 격자. 셀은 행우선으로 채워지고, 배치·빈 칸은 전적으로 manager가 정한다.
// 자동 배치 로직 없음(행/열 수 변경 시 reflow도 다루지 않는다).
export const ImageGridBlock: Block = {
	slug: 'imageGrid',
	interfaceName: 'ImageGridBlock',
	labels: { singular: '이미지 그리드', plural: '이미지 그리드' },
	fields: [
		{
			name: 'title',
			type: 'text',
			localized: true,
			admin: { description: '그리드 위에 표시할 제목입니다(비우면 표시 안 함).' },
		},
		{
			name: 'description',
			type: 'richText',
			localized: true,
			admin: { description: '제목 아래에 표시할 설명입니다(비우면 표시 안 함).' },
		},
		{
			type: 'row',
			fields: [
				{
					name: 'columns',
					type: 'number',
					required: true,
					defaultValue: 3,
					min: 1,
					admin: { width: '33.33%', description: '격자의 열 수입니다.' },
				},
				{
					name: 'rows',
					type: 'number',
					required: true,
					defaultValue: 2,
					min: 1,
					admin: { width: '33.33%', description: '격자의 행 수입니다.' },
				},
				{
					name: 'imageRatio',
					type: 'select',
					defaultValue: '1:1',
					options: [
						...IMAGE_RATIO_OPTIONS,
						{ label: '수동 입력(폭·높이)', value: 'manual' },
						{ label: '첫 번째 이미지 기준', value: 'firstImage' },
					],
					admin: { width: '33.33%', description: '모든 셀에 공통 적용할 비율입니다.' },
				},
			],
		},
		{
			type: 'row',
			admin: { condition: (_, siblingData) => siblingData?.imageRatio === 'manual' },
			fields: [
				{
					name: 'ratioWidth',
					type: 'number',
					defaultValue: 4,
					min: 1,
					admin: { width: '50%', description: '수동 비율의 폭입니다.' },
				},
				{
					name: 'ratioHeight',
					type: 'number',
					defaultValue: 3,
					min: 1,
					admin: { width: '50%', description: '수동 비율의 높이입니다.' },
				},
			],
		},
		{
			name: 'cells',
			type: 'array',
			labels: { singular: '셀', plural: '셀' },
			admin: {
				description:
					'왼쪽 위부터 행 순서대로 채워집니다. 이미지·캡션은 각각 비워도 되며(빈 셀), 행×열 수만큼만 표시됩니다.',
			},
			fields: [
				{ name: 'image', type: 'upload', relationTo: 'application-images' },
				{ name: 'caption', type: 'text', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

export default ImageGridBlock
