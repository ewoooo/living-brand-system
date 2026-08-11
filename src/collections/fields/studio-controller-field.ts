import type { Block, Field } from 'payload'

const AVAILABILITY_OPTIONS = [
	{ label: '사용 가능', value: 'enabled' },
	{ label: '읽기 전용', value: 'readonly' },
	{ label: '사용 안 함', value: 'disabled' },
] as const

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

function controlBaseFields(): Field[] {
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
		{ name: 'label', type: 'text', required: true, label: '라벨' },
		{
			name: 'availability',
			type: 'select',
			required: true,
			defaultValue: 'enabled',
			options: [...AVAILABILITY_OPTIONS],
			label: '사용 상태',
		},
	]
}

const controllerBlocks: Block[] = [
	{
		slug: 'text',
		interfaceName: 'StudioControllerTextControl',
		labels: { singular: '텍스트', plural: '텍스트' },
		fields: [
			...controlBaseFields(),
			{ name: 'defaultValue', type: 'text', defaultValue: '', label: '기본값' },
			{ name: 'multiline', type: 'checkbox', defaultValue: false, label: '여러 줄 입력' },
			{ name: 'maxLength', type: 'number', min: 1, label: '최대 글자 수' },
			{ name: 'placeholder', type: 'text', label: '안내 문구' },
		],
	},
	{
		slug: 'toggle',
		interfaceName: 'StudioControllerToggleControl',
		labels: { singular: '토글', plural: '토글' },
		fields: [
			...controlBaseFields(),
			{ name: 'defaultValue', type: 'checkbox', defaultValue: false, label: '기본값' },
		],
	},
	{
		slug: 'select',
		interfaceName: 'StudioControllerSelectControl',
		labels: { singular: '선택', plural: '선택' },
		fields: [
			...controlBaseFields(),
			{ name: 'defaultValue', type: 'text', label: '기본 선택값' },
			{
				name: 'options',
				type: 'array',
				required: true,
				minRows: 1,
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
		interfaceName: 'StudioControllerColorControl',
		labels: { singular: '색상', plural: '색상' },
		fields: [
			...controlBaseFields(),
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
		interfaceName: 'StudioControllerRangeControl',
		labels: { singular: '범위', plural: '범위' },
		fields: [
			...controlBaseFields(),
			{
				name: 'defaultValue',
				type: 'number',
				required: true,
				defaultValue: 0,
				label: '기본값',
			},
			{ name: 'min', type: 'number', required: true, defaultValue: 0, label: '최솟값' },
			{ name: 'max', type: 'number', required: true, defaultValue: 1, label: '최댓값' },
			{
				name: 'step',
				type: 'number',
				required: true,
				defaultValue: 0.01,
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
		interfaceName: 'StudioControllerPadControl',
		labels: { singular: '패드', plural: '패드' },
		fields: [
			...controlBaseFields(),
			{
				name: 'defaultValue',
				type: 'group',
				label: '기본 좌표',
				fields: [
					{
						name: 'x',
						type: 'number',
						required: true,
						defaultValue: 0,
						min: -1,
						max: 1,
					},
					{
						name: 'y',
						type: 'number',
						required: true,
						defaultValue: 0,
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

/** Studio가 발행할 공통 Controller Definition을 Payload에서 저작하는 선택 필드다. */
export function studioControllerField(): Field {
	return {
		name: 'controller',
		type: 'group',
		label: '컨트롤러',
		admin: {
			description:
				'비우면 기존 프로파일 설정을 사용합니다. 그룹과 컨트롤의 key는 Payload 행 id와 분리된 발행 계약 ID입니다.',
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
					{ name: 'title', type: 'text', required: true, label: '제목' },
					{
						name: 'collapsible',
						type: 'checkbox',
						defaultValue: false,
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
						blocks: controllerBlocks,
						label: '컨트롤',
					},
				],
			},
		],
	}
}
