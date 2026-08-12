import type { Block, Field } from 'payload'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'

const AVAILABILITY_OPTIONS = [
	{ label: '사용 가능', value: 'enabled' },
	{ label: '읽기 전용', value: 'readonly' },
	{ label: '사용 안 함', value: 'disabled' },
] as const

type StudioControllerAuthoringMode = 'define' | 'restrict'

export function studioControllerOverrideField({
	source,
	baseConfigs,
}: {
	source: 'graphic' | 'template'
	baseConfigs?: readonly unknown[]
}): Field {
	return {
		name: 'controllerOverride',
		type: 'json',
		label: 'Controller 제한',
		admin: {
			components: {
				Field: {
					path: '/components/admin/studio/studio-controller-override-field#StudioControllerOverrideField',
					clientProps: { source, baseConfigs },
				},
			},
		},
	}
}

/** Runtime/Service 지원 형식을 Admin이 추가하지 않고 좁히기만 하는 정책 필드다. */
export function studioOutputPolicyField({
	includeOriginal = false,
}: {
	includeOriginal?: boolean
} = {}): Field {
	return {
		name: 'output',
		type: 'group',
		label: '출력',
		admin: { description: '비우면 실행 구현이 지원하는 형식을 모두 허용합니다.' },
		fields: [
			{
				name: 'allowedFormats',
				type: 'select',
				hasMany: true,
				options: [...STUDIO_OUTPUT_FORMAT_OPTIONS],
				label: '허용 형식',
			},
			...(includeOriginal
				? [
						{
							name: 'original',
							type: 'checkbox' as const,
							defaultValue: true,
							label: '원본 다운로드 허용',
						},
					]
				: []),
		],
	}
}

/** Controller color와 기존 이미지 프로파일 색상에 공통으로 적용하는 hex 검증이다. */
export function validateHexColor(value: null | string | undefined): string | true {
	if (!value) return true
	return /^#[0-9a-fA-F]{6}$/.test(value) || '#rrggbb 형식의 hex 색상을 입력하세요.'
}

/** Pad 비율이 공통 Controller parser와 같은 유한한 양수인지 확인한다. */
export function validatePositiveNumber(value: null | number | undefined): string | true {
	if (value == null) return true
	return (Number.isFinite(value) && value > 0) || '0보다 큰 유한한 숫자를 입력하세요.'
}

function controlBaseFields(mode: StudioControllerAuthoringMode): Field[] {
	const defines = mode === 'define'
	return [
		{
			name: 'key',
			type: 'text',
			required: true,
			label: '컨트롤 ID',
			admin: {
				description:
					'발행 시 Controller Definition의 id가 됩니다. 모든 그룹에서 겹치지 않아야 합니다.',
			},
		},
		{ name: 'label', type: 'text', required: defines, label: '라벨' },
		{
			name: 'availability',
			type: 'select',
			required: defines,
			...(defines ? { defaultValue: 'enabled' } : {}),
			options: [...AVAILABILITY_OPTIONS],
			label: '사용 상태',
		},
	]
}

function controllerBlocks(mode: StudioControllerAuthoringMode): Block[] {
	const defines = mode === 'define'
	const interfaceSuffix = defines ? 'Control' : 'Policy'
	return [
		{
			slug: 'text',
			interfaceName: `StudioControllerText${interfaceSuffix}`,
			labels: { singular: '텍스트', plural: '텍스트' },
			fields: [
				...controlBaseFields(mode),
				{
					name: 'defaultValue',
					type: 'text',
					...(defines ? { defaultValue: '' } : {}),
					label: '기본값',
				},
				{
					name: 'multiline',
					type: 'checkbox',
					...(defines ? { defaultValue: false } : {}),
					label: '여러 줄 입력',
				},
				{ name: 'maxLength', type: 'number', min: 1, label: '최대 글자 수' },
				{ name: 'placeholder', type: 'text', label: '안내 문구' },
			],
		},
		{
			slug: 'toggle',
			interfaceName: `StudioControllerToggle${interfaceSuffix}`,
			labels: { singular: '토글', plural: '토글' },
			fields: [
				...controlBaseFields(mode),
				{
					name: 'defaultValue',
					type: 'checkbox',
					...(defines ? { defaultValue: false } : {}),
					label: '기본값',
				},
			],
		},
		{
			slug: 'select',
			interfaceName: `StudioControllerSelect${interfaceSuffix}`,
			labels: { singular: '선택', plural: '선택' },
			fields: [
				...controlBaseFields(mode),
				{ name: 'defaultValue', type: 'text', label: '기본 선택값' },
				{
					name: 'options',
					type: 'array',
					required: defines,
					...(defines ? { minRows: 1 } : {}),
					label: '선택지',
					labels: { singular: '선택지', plural: '선택지' },
					fields: [
						{ name: 'value', type: 'text', required: true, label: '값' },
						{ name: 'label', type: 'text', required: true, label: '라벨' },
					],
				},
				{ name: 'placeholder', type: 'text', label: '안내 문구' },
			],
		},
		{
			slug: 'color',
			interfaceName: `StudioControllerColor${interfaceSuffix}`,
			labels: { singular: '색상', plural: '색상' },
			fields: [
				...controlBaseFields(mode),
				{
					name: 'defaultValue',
					type: 'text',
					label: '기본 색상',
					validate: validateHexColor,
					admin: { description: '#rrggbb 형식으로 입력합니다.' },
				},
			],
		},
		{
			slug: 'range',
			interfaceName: `StudioControllerRange${interfaceSuffix}`,
			labels: { singular: '범위', plural: '범위' },
			fields: [
				...controlBaseFields(mode),
				{
					name: 'defaultValue',
					type: 'number',
					required: defines,
					...(defines ? { defaultValue: 0 } : {}),
					label: '기본값',
				},
				{
					name: 'min',
					type: 'number',
					required: defines,
					...(defines ? { defaultValue: 0 } : {}),
					label: '최솟값',
				},
				{
					name: 'max',
					type: 'number',
					required: defines,
					...(defines ? { defaultValue: 1 } : {}),
					label: '최댓값',
				},
				{
					name: 'step',
					type: 'number',
					required: defines,
					...(defines ? { defaultValue: 0.01 } : {}),
					label: '증감 단위',
				},
				{
					name: 'display',
					type: 'group',
					label: '표시 형식',
					fields: [
						{ name: 'unit', type: 'text', label: '단위' },
						{ name: 'precision', type: 'number', min: 0, label: '소수 자릿수' },
					],
				},
			],
		},
		{
			slug: 'pad',
			interfaceName: `StudioControllerPad${interfaceSuffix}`,
			labels: { singular: '패드', plural: '패드' },
			fields: [
				...controlBaseFields(mode),
				{
					name: 'defaultValue',
					type: 'group',
					label: '기본 좌표',
					fields: [
						{
							name: 'x',
							type: 'number',
							required: defines,
							...(defines ? { defaultValue: 0 } : {}),
							min: -1,
							max: 1,
						},
						{
							name: 'y',
							type: 'number',
							required: defines,
							...(defines ? { defaultValue: 0 } : {}),
							min: -1,
							max: 1,
						},
					],
				},
				{
					name: 'aspectRatio',
					type: 'number',
					label: '가로세로 비율',
					validate: validatePositiveNumber,
				},
			],
		},
	]
}

/** Image는 Definition을, Graphic·Template은 기존 Definition을 좁히는 Policy를 저작한다. */
export function studioControllerField({
	mode = 'define',
	hidden = false,
	description = '비우면 기존 프로파일 설정을 사용합니다. 그룹과 컨트롤의 key는 Payload 행 id와 분리된 발행 계약 ID입니다.',
}: {
	mode?: StudioControllerAuthoringMode
	hidden?: boolean
	description?: string
} = {}): Field {
	const defines = mode === 'define'
	return {
		name: 'controller',
		type: 'group',
		label: '컨트롤러',
		admin: {
			description,
			hidden,
		},
		fields: [
			{
				name: 'groups',
				type: 'array',
				label: '컨트롤 그룹',
				labels: { singular: '컨트롤 그룹', plural: '컨트롤 그룹' },
				fields: [
					{
						name: 'key',
						type: 'text',
						required: true,
						label: '그룹 ID',
						admin: { description: '발행 시 Controller Group의 id가 됩니다.' },
					},
					{ name: 'title', type: 'text', required: defines, label: '제목' },
					{
						name: 'collapsible',
						type: 'checkbox',
						...(defines ? { defaultValue: false } : {}),
						label: '접을 수 있음',
					},
					{
						name: 'defaultOpen',
						type: 'checkbox',
						label: '처음에 열기',
						admin: {
							condition: (_, siblingData) => siblingData.collapsible === true,
						},
					},
					{
						name: 'controls',
						type: 'blocks',
						blocks: controllerBlocks(mode),
						label: '컨트롤',
					},
				],
			},
		],
	}
}
