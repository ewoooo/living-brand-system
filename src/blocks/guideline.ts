import type { Block, Field } from 'payload'

export function guidelineChecksField(): Field {
	return {
		name: 'checks',
		type: 'array',
		interfaceName: 'GuidelineChecks',
		labels: {
			singular: 'Check',
			plural: 'Checks',
		},
		admin: {
			description: '이 문서 단위에 적용할 검수 선언입니다.',
			initCollapsed: true,
		},
		fields: [
			{
				name: 'key',
				type: 'text',
				required: true,
				admin: { description: '시나리오와 검수 결과에서 사용하는 안정적인 식별자입니다.' },
			},
			{
				name: 'title',
				type: 'text',
				required: true,
			},
			{
				name: 'tier',
				type: 'select',
				required: true,
				options: ['required', 'recommended'],
			},
			{
				name: 'checker',
				type: 'relationship',
				relationTo: 'rule-checkers',
				required: true,
				admin: {
					allowCreate: true,
					allowEdit: true,
					appearance: 'drawer',
					description: '검수 실행 방식과 구현체를 선택합니다.',
				},
			},
			{
				name: 'options',
				type: 'json',
				admin: {
					description: '이 Check에서 Checker에 전달할 source별 설정입니다.',
				},
			},
			{
				name: 'messages',
				type: 'group',
				fields: [
					{ name: 'pass', type: 'textarea' },
					{ name: 'ok', type: 'textarea' },
					{ name: 'needsReview', type: 'textarea' },
					{ name: 'fail', type: 'textarea' },
				],
			},
		],
	}
}

// 모든 가이드라인 블록이 공유하는 표준 필드. Check와 근거 콘텐츠는 이 블록이 소유한다.
function baseBlockFields(): Field[] {
	return [guidelineChecksField()]
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
		...baseBlockFields(),
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
		...baseBlockFields(),
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
		...baseBlockFields(),
	],
}

// Do/Don't 그리드. 그룹은 같은 주제의 권장·금지 예시를 묶는다.
export const DoDontBlock: Block = {
	slug: 'doDont',
	interfaceName: 'DoDontBlock',
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'groups',
			type: 'array',
			minRows: 1,
			admin: { description: '카테고리 단위 예시 그룹입니다.' },
			fields: [
				{ name: 'category', type: 'text', localized: true },
				{
					name: 'examples',
					type: 'array',
					minRows: 1,
					fields: [
						{
							name: 'kind',
							type: 'select',
							required: true,
							defaultValue: 'dont',
							options: [
								{ label: 'Do (권장)', value: 'do' },
								{ label: "Don't (금지)", value: 'dont' },
							],
						},
						{ name: 'image', type: 'upload', relationTo: 'application-images' },
						{ name: 'caption', type: 'text', localized: true },
					],
				},
			],
		},
		guidelineChecksField(),
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock, ColorPaletteBlock, DoDontBlock]
