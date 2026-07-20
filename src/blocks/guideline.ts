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
		// 경로 파생 enum 이름이 Postgres 63자 제한을 넘지 않도록 전역 enum을 공유한다.
		enumName: 'enum_image_scale',
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

// 이미지 묶음을 사용자가 넘겨보는 독립 캐러셀. 콘텐츠 열의 개수와 무관하게 명시적으로 배치한다.
export const CarouselBlock: Block = {
	slug: 'carousel',
	interfaceName: 'CarouselBlock',
	labels: { singular: '캐러셀', plural: '캐러셀' },
	fields: [
		{
			name: 'imageRatio',
			type: 'select',
			defaultValue: '16:9',
			options: [...IMAGE_RATIO_OPTIONS],
			admin: { description: '슬라이드 이미지의 표시 비율입니다.' },
		},
		{
			name: 'slides',
			type: 'array',
			minRows: 2,
			labels: { singular: '슬라이드', plural: '슬라이드' },
			fields: [
				{
					name: 'image',
					type: 'upload',
					relationTo: 'application-images',
					required: true,
				},
				{ name: 'caption', type: 'text', localized: true },
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
			name: 'images',
			type: 'array',
			minRows: 1,
			maxRows: 3,
			labels: { singular: '이미지', plural: '이미지' },
			fields: [
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

// 서체를 다루는 블록이 공유하는 관계 필드. 서체는 brand-typefaces가 폰트 파일과 함께 소유한다.
function typefaceField(): Field {
	return {
		name: 'typeface',
		type: 'relationship',
		relationTo: 'brand-typefaces',
		admin: {
			description: '적용할 서체입니다. 비우면 기본 타이틀 서체를 사용합니다.',
		},
	}
}

// 콜아웃. 지켜야 할 규칙 문장을 판정별(must/recommended/dont)로 강조한다.
export const CalloutBlock: Block = {
	slug: 'callout',
	interfaceName: 'CalloutBlock',
	labels: { singular: '콜아웃', plural: '콜아웃' },
	fields: [
		{
			name: 'kind',
			type: 'select',
			required: true,
			defaultValue: 'must',
			options: [
				{ label: '반드시 (Must)', value: 'must' },
				{ label: '권장 (Recommended)', value: 'recommended' },
				{ label: '금지 (Don’t)', value: 'dont' },
			],
		},
		{
			name: 'title',
			type: 'text',
			localized: true,
			admin: { description: '생략하면 판정 기본 라벨(반드시/권장/금지)이 제목이 됩니다.' },
		},
		{
			name: 'items',
			type: 'array',
			minRows: 1,
			labels: { singular: '규칙 문장', plural: '규칙 문장' },
			fields: [{ name: 'text', type: 'text', required: true, localized: true }],
		},
		...baseBlockFields(),
	],
}

// key-value 규격 목록. 타이포·그리드처럼 짧은 정량/정성 스펙을 그룹 카드로 구조화한다.
export const SpecListBlock: Block = {
	slug: 'specList',
	interfaceName: 'SpecListBlock',
	labels: { singular: '스펙 목록', plural: '스펙 목록' },
	fields: [
		{
			name: 'groups',
			type: 'array',
			minRows: 1,
			labels: { singular: '스펙 그룹', plural: '스펙 그룹' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{
					name: 'specs',
					type: 'array',
					minRows: 1,
					labels: { singular: '규격', plural: '규격' },
					fields: [
						{ name: 'key', type: 'text', required: true },
						{ name: 'value', type: 'text', required: true },
					],
				},
			],
		},
		...baseBlockFields(),
	],
}

// 공식 시그니처·태그라인 전시. 문구 자체가 메시징 검수의 근거가 된다.
export const SignatureShowcaseBlock: Block = {
	slug: 'signatureShowcase',
	interfaceName: 'SignatureShowcaseBlock',
	labels: { singular: '시그니처 쇼케이스', plural: '시그니처 쇼케이스' },
	fields: [
		{
			name: 'signatures',
			type: 'array',
			minRows: 1,
			labels: { singular: '시그니처', plural: '시그니처' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{ name: 'phrase', type: 'text', required: true },
				{ name: 'note', type: 'textarea', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

// 라이브 타입 스페시먼. tier별 초기 샘플 문구만 저장하고 타이핑·정렬·행간 상태는 저장하지 않는다.
export const TypeSpecimenBlock: Block = {
	slug: 'typeSpecimen',
	interfaceName: 'TypeSpecimenBlock',
	labels: { singular: '타입 스페시먼', plural: '타입 스페시먼' },
	fields: [
		typefaceField(),
		{
			name: 'samples',
			type: 'group',
			admin: {
				description: 'tier별 초기 샘플 문구입니다. 비우면 중립 기본 문구를 사용합니다.',
			},
			fields: [
				{ name: 'word', type: 'text', localized: true },
				{ name: 'sentence', type: 'text', localized: true },
				{ name: 'paragraph', type: 'textarea', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

// 타입 스케일. 타입 토큰별 샘플과 수치 규격(size/line-height/weight)을 나열한다.
export const TypeScaleBlock: Block = {
	slug: 'typeScale',
	interfaceName: 'TypeScaleBlock',
	labels: { singular: '타입 스케일', plural: '타입 스케일' },
	fields: [
		typefaceField(),
		{
			name: 'items',
			type: 'array',
			minRows: 1,
			labels: { singular: '타입 토큰', plural: '타입 토큰' },
			fields: [
				{ name: 'name', type: 'text', required: true },
				{
					name: 'sample',
					type: 'text',
					localized: true,
					admin: { description: '비우면 중립 기본 문구를 사용합니다.' },
				},
				{
					type: 'row',
					fields: [
						{ name: 'sizePx', type: 'number', required: true, min: 1 },
						{ name: 'lineHeightPx', type: 'number', required: true, min: 1 },
						{ name: 'weight', type: 'number', required: true, min: 100, max: 1000 },
					],
				},
			],
		},
		...baseBlockFields(),
	],
}

// 레이아웃 그리드 규격. 컬럼 수·거터·마진 수치를 evidence로 보존하고 오버레이로 시각화한다.
export const LayoutGridBlock: Block = {
	slug: 'layoutGrid',
	interfaceName: 'LayoutGridBlock',
	labels: { singular: '레이아웃 그리드', plural: '레이아웃 그리드' },
	fields: [
		{
			name: 'accent',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '컬럼 오버레이 강조색입니다. 비우면 중립색을 사용합니다.' },
		},
		{
			name: 'variants',
			type: 'array',
			minRows: 1,
			labels: { singular: '그리드 규격', plural: '그리드 규격' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{
					type: 'row',
					fields: [
						{ name: 'columns', type: 'number', required: true, min: 1, max: 24 },
						{
							name: 'gutter',
							type: 'text',
							admin: { description: "CSS 길이 문자열입니다. 예: '24px'." },
						},
						{
							name: 'margin',
							type: 'text',
							admin: { description: "CSS 길이 문자열입니다. 예: '64px'." },
						},
					],
				},
			],
		},
		...baseBlockFields(),
	],
}

// 글리프 인스펙터. 위젯형 블록 — 제목과 서체 선택만 저장한다.
export const GlyphGridBlock: Block = {
	slug: 'glyphGrid',
	interfaceName: 'GlyphGridBlock',
	labels: { singular: '글리프 그리드', plural: '글리프 그리드' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		typefaceField(),
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
					admin: { width: '33.33%', description: '예시 이미지의 표시 비율입니다.' },
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
						width: '33.33%',
						description: '가로 스택은 넓은 화면에서 그룹을 나란히 배치합니다.',
					},
				},
				{
					name: 'exampleColumns',
					type: 'select',
					defaultValue: '3',
					options: [
						{ label: '2열', value: '2' },
						{ label: '3열', value: '3' },
						{ label: '4열', value: '4' },
					],
					admin: {
						width: '33.33%',
						description:
							'세로 스택의 그룹 내부 예시를 넓은 화면에서 배치할 열 수입니다.',
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
