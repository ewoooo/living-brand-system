import type { Block, Field } from 'payload'

function policyField(): Field {
	return {
		name: 'policy',
		type: 'group',
		admin: {
			description: '검색과 Agent가 정책 단위로 읽을 때 사용하는 선택 메타입니다.',
		},
		fields: [
			{ name: 'enabled', type: 'checkbox', defaultValue: false },
			{ name: 'key', type: 'text' },
			{ name: 'summary', type: 'textarea', localized: true },
			{
				name: 'rules',
				type: 'relationship',
				relationTo: 'rules',
				hasMany: true,
			},
		],
	}
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

export const ColumnUnitBlock: Block = {
	slug: 'columnUnit',
	interfaceName: 'ColumnUnitBlock',
	fields: [
		{ name: 'title', type: 'text', localized: true },
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
		policyField(),
	],
}

export const MediaShowcaseBlock: Block = {
	slug: 'mediaShowcase',
	interfaceName: 'MediaShowcaseBlock',
	fields: [
		{
			name: 'image',
			type: 'upload',
			relationTo: 'application-images',
		},
		imageBackgroundColorField(),
		imageScaleField(),
		policyField(),
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock]
