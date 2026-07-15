import type { ArrayField, Block, Field, FieldHook } from 'payload'
import { validateGuidelineCheckOptions } from '@/features/guideline/checks/validate-guideline-check-options'
import { relationshipId } from '@/features/guideline/utils/block-text'

type CheckExecutor = 'deterministic' | 'heuristic' | 'manual'

const executorCondition =
	(executor: CheckExecutor) => (_data: unknown, siblingData: { executor?: CheckExecutor }) =>
		siblingData?.executor === executor

const nonHeuristicCondition = (_data: unknown, siblingData: { executor?: CheckExecutor }) =>
	siblingData?.executor !== 'heuristic'

const measureCriterionCondition = (_data: unknown, siblingData: { kind?: string }) =>
	siblingData?.kind === 'measure'

type HeuristicCriterionRow = {
	kind?: string
	expected?: string
	operator?: string
	expectedValue?: number
	max?: number
}

const validateHeuristicCriteria: NonNullable<ArrayField['validate']> = (value, { siblingData }) => {
	const executor = (siblingData as { executor?: CheckExecutor })?.executor
	if (executor !== 'heuristic') return true
	if (!Array.isArray(value) || value.length === 0) {
		return 'Heuristic Check에는 판정 기준이 1개 이상 필요합니다.'
	}
	for (const row of value as HeuristicCriterionRow[]) {
		if (row?.kind === 'measure') {
			if (!row.operator || typeof row.expectedValue !== 'number') {
				return '수치형 기준에는 연산과 기대값이 필요합니다.'
			}
			if (
				row.operator === 'between' &&
				!(typeof row.max === 'number' && row.max > row.expectedValue)
			) {
				return '범위(between) 기준에는 기대값보다 큰 최대값이 필요합니다.'
			}
		} else if (row?.expected !== 'present' && row?.expected !== 'absent') {
			return '관찰형 기준에는 적합 기준(있어야 함/없어야 함)이 필요합니다.'
		}
	}
	return true
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

const populateCheckExecutor: FieldHook = async ({ req, siblingData, value }) => {
	const checkerId = relationshipId(siblingData?.checker)
	if (checkerId === null) return value
	const checker = await req.payload.findByID({
		collection: 'rule-checkers',
		id: checkerId,
		depth: 0,
	})
	return checker.executor
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
				options: [
					{ label: 'Deterministic', value: 'deterministic' },
					{ label: 'Heuristic (AI)', value: 'heuristic' },
					{ label: 'Advisory (AI)', value: 'manual' },
				],
				hooks: { beforeValidate: [populateCheckExecutor] },
				admin: {
					hidden: true,
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
					components: {
						Field: '/components/admin/CheckCheckerField',
					},
				},
			},
			{
				name: 'options',
				type: 'json',
				validate: validateGuidelineCheckOptions,
				admin: {
					condition: executorCondition('deterministic'),
					description: '이 Check에서 결정론적 Checker에 전달할 설정입니다.',
					components: {
						Field: '/components/admin/CheckOptionsField',
					},
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
								admin: { width: '55%' },
							},
							{
								name: 'kind',
								enumName: 'enum_heuristic_criterion_kind',
								type: 'select',
								required: true,
								defaultValue: 'presence',
								label: '기준 유형',
								options: [
									{ label: '관찰형', value: 'presence' },
									{ label: '수치형', value: 'measure' },
								],
								admin: { width: '20%' },
							},
							{
								name: 'expected',
								enumName: 'enum_heuristic_criterion_expected',
								type: 'select',
								label: '적합 기준',
								options: [
									{ label: '있어야 함', value: 'present' },
									{ label: '없어야 함', value: 'absent' },
								],
								admin: {
									width: '25%',
									condition: (_data, siblingData) =>
										(siblingData as { kind?: string })?.kind !== 'measure',
								},
							},
						],
					},
					{
						type: 'row',
						fields: [
							{
								name: 'operator',
								enumName: 'enum_heuristic_criterion_operator',
								type: 'select',
								label: '연산',
								options: [
									{ label: '이상 (≥)', value: 'gte' },
									{ label: '이하 (≤)', value: 'lte' },
									{ label: '범위', value: 'between' },
								],
								admin: { width: '25%', condition: measureCriterionCondition },
							},
							{
								name: 'expectedValue',
								type: 'number',
								label: '기대값',
								admin: { width: '25%', condition: measureCriterionCondition },
							},
							{
								name: 'max',
								type: 'number',
								label: '최대값',
								admin: {
									width: '25%',
									condition: (_data, siblingData) =>
										(siblingData as { kind?: string; operator?: string })
											?.kind === 'measure' &&
										(siblingData as { operator?: string })?.operator ===
											'between',
								},
							},
							{
								name: 'unit',
								type: 'text',
								maxLength: 20,
								label: '단위',
								admin: { width: '25%', condition: measureCriterionCondition },
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
			type: 'row',
			fields: [
				{
					name: 'imageRatio',
					type: 'select',
					defaultValue: '4:3',
					options: [
						{ label: '4:3', value: '4:3' },
						{ label: '1:1', value: '1:1' },
						{ label: '16:9', value: '16:9' },
					],
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
		guidelineChecksField(),
	],
}

export const guidelineBlocks = [ColumnUnitBlock, MediaShowcaseBlock, ColorPaletteBlock, DoDontBlock]
