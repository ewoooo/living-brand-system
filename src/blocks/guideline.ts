import type { ArrayField, Block, Field, FieldHook } from 'payload'

type CheckExecutor = 'deterministic' | 'heuristic' | 'manual'

const executorCondition =
	(executor: CheckExecutor) => (_data: unknown, siblingData: { executor?: CheckExecutor }) =>
		siblingData?.executor === executor

const nonHeuristicCondition = (_data: unknown, siblingData: { executor?: CheckExecutor }) =>
	siblingData?.executor !== 'heuristic'

const validateHeuristicCriteria: NonNullable<ArrayField['validate']> = (value, { siblingData }) => {
	const executor = (siblingData as { executor?: CheckExecutor })?.executor
	if (executor !== 'heuristic') return true
	return (
		(Array.isArray(value) && value.length > 0) ||
		'Heuristic Check에는 판정 기준이 1개 이상 필요합니다.'
	)
}

export function checkKeyFromEnglishTitle(value: unknown): string {
	if (typeof value !== 'string') return ''

	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

const populateCheckKey: FieldHook = ({ siblingData, value }) => {
	if (typeof value === 'string' && value.trim()) return value.trim()
	return checkKeyFromEnglishTitle(siblingData?.title)
}

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
				name: 'title',
				type: 'text',
				required: true,
				label: 'Title (EN)',
			},
			{
				name: 'titleKo',
				type: 'text',
				label: 'Title (KO)',
			},
			{
				name: 'key',
				type: 'text',
				required: true,
				hooks: { beforeValidate: [populateCheckKey] },
				admin: {
					readOnly: true,
					description:
						'최초 저장 시 영문 제목을 기준으로 자동 생성되는 안정적인 식별자입니다.',
				},
			},
			{
				name: 'tier',
				type: 'select',
				required: true,
				options: ['required', 'recommended'],
			},
			{
				name: 'executor',
				type: 'select',
				required: true,
				defaultValue: 'deterministic',
				options: [
					{ label: 'Deterministic', value: 'deterministic' },
					{ label: 'Heuristic (AI)', value: 'heuristic' },
					{ label: 'Manual', value: 'manual' },
				],
				admin: {
					description: 'Checker 후보와 아래 설정 항목을 이 실행 유형에 맞춰 제한합니다.',
				},
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
				filterOptions: ({ siblingData }) => {
					const executor = (siblingData as { executor?: CheckExecutor })?.executor
					return executor ? { executor: { equals: executor } } : true
				},
			},
			{
				name: 'options',
				type: 'json',
				admin: {
					condition: executorCondition('deterministic'),
					description: '이 Check에서 결정론적 Checker에 전달할 설정입니다.',
				},
			},
			{
				name: 'criteria',
				type: 'array',
				minRows: 1,
				validate: validateHeuristicCriteria,
				labels: {
					singular: '판정 기준',
					plural: '판정 기준',
				},
				admin: {
					condition: executorCondition('heuristic'),
					description: 'AI가 관측할 질문과 통과 기준을 행 단위로 입력합니다.',
					initCollapsed: false,
				},
				fields: [
					{
						type: 'row',
						fields: [
							{
								name: 'question',
								type: 'text',
								required: true,
								maxLength: 300,
								label: '판정 질문',
								admin: { width: '70%' },
							},
							{
								name: 'expected',
								enumName: 'enum_heuristic_criterion_expected',
								type: 'select',
								required: true,
								label: '적합 기준',
								options: [
									{ label: '있어야 함', value: 'present' },
									{ label: '없어야 함', value: 'absent' },
								],
								admin: { width: '30%' },
							},
						],
					},
				],
			},
			{
				name: 'heuristicPrompt',
				type: 'textarea',
				maxLength: 2000,
				admin: {
					condition: executorCondition('heuristic'),
					description:
						'AI가 이 Check를 판단할 때 추가로 적용할 기준입니다. 선택 입력, 최대 2,000자.',
				},
			},
			{
				name: 'messages',
				type: 'group',
				admin: {
					condition: nonHeuristicCondition,
					description: '결정론적 또는 수동 검수 결과에 표시할 메시지입니다.',
				},
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
