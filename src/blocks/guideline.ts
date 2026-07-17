import type { Block, Field } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'

// 문서/블록은 Rule 정의를 소유하지 않고 rules 컬렉션의 규칙을 참조로 선택한다.
export function guidelineRulesField(): Field {
	return {
		name: 'rules',
		type: 'relationship',
		relationTo: 'rules',
		hasMany: true,
		admin: {
			allowCreate: true,
			allowEdit: true,
			appearance: 'drawer',
			description: '이 문서 단위에 적용할 검수 규칙입니다.',
		},
	}
}

// 모든 가이드라인 블록이 공유하는 표준 필드. 근거 콘텐츠는 이 블록이 소유하고 Rule은 참조한다.
function baseBlockFields(): Field[] {
	return [guidelineRulesField()]
}

function imageBackgroundColorField(): Field {
	return {
		name: 'imageBackgroundColor',
		type: 'relationship',
		relationTo: 'brand-colors',
		admin: {
			description: '이미지 영역 뒤에 적용할 브랜드 컬러입니다.',
		},
	}
}

function imageScaleField(): Field {
	return {
		name: 'imageScale',
		type: 'select',
		defaultValue: '100',
		options: Array.from({ length: 10 }, (_, index) => String((index + 1) * 10)),
	}
}

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
			name: 'image',
			type: 'upload',
			relationTo: 'application-images',
		},
		imageBackgroundColorField(),
		imageScaleField(),
		...baseBlockFields(),
	],
}

export const ColorPaletteBlock: Block = {
	slug: 'colorPalette',
	interfaceName: 'ColorPaletteBlock',
	labels: { singular: '컬러 팔레트', plural: '컬러 팔레트' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'colors',
			type: 'relationship',
			relationTo: 'brand-colors',
			hasMany: true,
			required: true,
			admin: {
				description: '선택한 순서대로 스와치 카드가 표시됩니다.',
			},
		},
		...baseBlockFields(),
	],
}

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
					admin: { width: '50%', description: '예시 이미지의 표시 비율입니다.' },
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
						width: '50%',
						description: '가로 스택은 넓은 화면에서 그룹을 나란히 배치합니다.',
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
		guidelineRulesField(),
	],
}
