import type { Block, Field } from 'payload'

// 단일 룰 관계. 룰은 "이미지+캡션을 가진 원자 문서화 단위"에 붙는다.
// 단위가 블록이면 블록 레벨(baseBlockFields), do/dont처럼 그룹이면 그룹 레벨에 둔다.
function ruleField(description: string): Field {
	return {
		name: 'rule',
		type: 'relationship',
		relationTo: 'rules',
		filterOptions: {
			status: { equals: 'live' },
		},
		admin: { description },
	}
}

// 모든 가이드라인 블록이 공유하는 표준 필드. 새 공통 옵션은 여기 한 곳에 추가한다.
// 가이드라인(블록)이 콘텐츠 SSOT이고, 연결된 룰의 evidence·referenceAssets는
// afterChange 훅이 블록 내용에서 파생한다. 검수 실행은 Rules 컬렉션을 직접 읽는다.
function baseBlockFields(): Field[] {
	return [
		ruleField(
			'이 블록이 문서화하는 룰입니다. 룰의 기준·이미지는 이 블록 내용에서 자동 파생됩니다.',
		),
	]
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

// Do/Don't 그리드. do/dont는 카테고리(그룹)별로 서로 다른 룰을 문서화하므로(1:N),
// 룰을 블록이 아니라 그룹 레벨에 둔다. 각 그룹 = 룰 1개 + 예시 카드 여러 개.
export const DoDontBlock: Block = {
	slug: 'doDont',
	interfaceName: 'DoDontBlock',
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'groups',
			type: 'array',
			minRows: 1,
			admin: { description: '카테고리 단위 그룹. 그룹마다 룰 1개를 문서화합니다.' },
			fields: [
				{ name: 'category', type: 'text', localized: true },
				ruleField('이 그룹(카테고리)이 문서화하는 룰입니다.'),
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
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock, ColorPaletteBlock, DoDontBlock]
