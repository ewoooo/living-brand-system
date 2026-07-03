import type { Block, Field } from 'payload'

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
	],
}

export const ColorPaletteBlock: Block = {
	slug: 'colorPalette',
	interfaceName: 'ColorPaletteBlock',
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
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock, ColorPaletteBlock]
