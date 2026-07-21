import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { baseBlockFields } from '../shared/fields'

// 이미지 묶음을 사용자가 넘겨보는 독립 캐러셀. 콘텐츠 열의 개수와 무관하게 명시적으로 배치한다.
export const CarouselBlock: Block = {
	slug: 'carousel',
	interfaceName: 'CarouselBlock',
	labels: { singular: '캐러셀', plural: '캐러셀' },
	fields: [
		{
			name: 'imageRatio',
			type: 'select',
			defaultValue: '16:9',
			options: [...IMAGE_RATIO_OPTIONS],
			admin: { description: '슬라이드 이미지의 표시 비율입니다.' },
		},
		{
			name: 'slides',
			type: 'array',
			minRows: 2,
			labels: { singular: '슬라이드', plural: '슬라이드' },
			fields: [
				{
					name: 'image',
					type: 'upload',
					relationTo: 'application-images',
					required: true,
				},
				{ name: 'caption', type: 'text', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

export default CarouselBlock
