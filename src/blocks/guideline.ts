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
			],
		},
		policyField(),
	],
}

export const MediaShowcaseBlock: Block = {
	slug: 'mediaShowcase',
	interfaceName: 'MediaShowcaseBlock',
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{ name: 'body', type: 'richText', localized: true },
		{
			name: 'image',
			type: 'upload',
			relationTo: 'application-images',
		},
		policyField(),
	],
}

export const ExampleGridBlock: Block = {
	slug: 'exampleGrid',
	interfaceName: 'ExampleGridBlock',
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'columns',
			type: 'select',
			defaultValue: '2',
			options: ['2', '3', '4'],
		},
		{
			name: 'items',
			type: 'array',
			minRows: 1,
			fields: [
				{ name: 'title', type: 'text', localized: true },
				{
					name: 'image',
					type: 'upload',
					relationTo: 'application-images',
				},
				{ name: 'caption', type: 'textarea', localized: true },
			],
		},
		policyField(),
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock, ExampleGridBlock]
