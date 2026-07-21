import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { baseBlockFields, imageBackgroundColorField, imageScaleField } from '../shared/fields'

export const MediaShowcaseBlock: Block = {
	slug: 'mediaShowcase',
	interfaceName: 'MediaShowcaseBlock',
	labels: { singular: '미디어 쇼케이스', plural: '미디어 쇼케이스' },
	fields: [
		{
			name: 'imageRatio',
			type: 'select',
			defaultValue: '16:9',
			options: [...IMAGE_RATIO_OPTIONS],
			admin: { description: '이미지의 표시 비율입니다.' },
		},
		{
			name: 'images',
			type: 'array',
			minRows: 1,
			maxRows: 3,
			labels: { singular: '이미지', plural: '이미지' },
			fields: [
				{
					name: 'image',
					type: 'upload',
					relationTo: 'application-images',
				},
				imageBackgroundColorField(),
				imageScaleField(),
			],
		},
		...baseBlockFields(),
	],
}
