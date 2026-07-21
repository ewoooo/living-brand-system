import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { baseBlockFields, imageBackgroundColorField, imageScaleField } from '../shared/fields'

export const ContentColumnsBlock: Block = {
	slug: 'contentColumns',
	interfaceName: 'ContentColumnsBlock',
	labels: { singular: '콘텐츠 열', plural: '콘텐츠 열' },
	fields: [
		{
			name: 'imageRatio',
			type: 'select',
			defaultValue: '4:3',
			options: [...IMAGE_RATIO_OPTIONS],
			admin: { description: '열 이미지의 표시 비율입니다.' },
		},
		{
			name: 'columns',
			type: 'array',
			minRows: 1,
			maxRows: 3,
			fields: [
				{ name: 'heading', type: 'text', localized: true },
				{ name: 'body', type: 'richText', localized: true },
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

export default ContentColumnsBlock
