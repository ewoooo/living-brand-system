import type { Field } from 'payload'
import { cardsField } from '@/features/guideline/cards/schema'

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

export const BLOCK_LAYOUTS = [
	{ label: '격자', value: 'grid' },
	{ label: '캐러셀', value: 'carousel' },
] as const
export type BlockLayout = (typeof BLOCK_LAYOUTS)[number]['value']

/** 줄 높이 단계. 실제 높이는 `rhythm.ts`의 `CARD_ROW_HEIGHT`가 소유한다. */
export const ROW_HEIGHTS = [
	{ label: '낮게', value: 'low' },
	{ label: '보통', value: 'medium' },
	{ label: '높게', value: 'high' },
] as const
export type RowHeight = (typeof ROW_HEIGHTS)[number]['value']

/** 카드 판에 붙는 판정 표식. 블록이 갖는다 — 한 블록 안에서 Do와 Don't를 섞는 자유는 데이터가 쓴 적이 없다. */
export const BLOCK_MARKS = [
	{ label: '없음', value: 'none' },
	{ label: 'Do (권장)', value: 'do' },
	{ label: 'OK (허용)', value: 'ok' },
	{ label: "Don't (금지)", value: 'dont' },
] as const
export type BlockMark = (typeof BLOCK_MARKS)[number]['value']

/**
 * 기본 블록의 필드. 블록의 책임은 다섯이다(2026-09-07 모델): 카드 레이아웃, 제목·설명, 에셋 다운로드 유무,
 * rules, 그리고 앵커(섹션만 — `anchorField`). 그 밖의 것은 카드가 갖는다.
 *
 * 🔴 배치는 **높이 기준**이다. 블록이 줄 높이(`rowHeight`)를 정하고 카드 폭은 각 카드의 비율에서 나온다.
 *    캐러셀은 그 줄 하나를 가로로 넘기고, 격자는 줄이 차면 다음 줄로 내려간다.
 */
export function baseContentFields(): Field[] {
	return [
		{ name: 'title', type: 'text', localized: true },
		{ name: 'description', type: 'richText', localized: true },
		{
			type: 'row',
			fields: [
				{
					name: 'layout',
					type: 'select',
					required: true,
					defaultValue: 'grid',
					enumName: 'enum_block_layout',
					options: [...BLOCK_LAYOUTS],
					admin: { width: '33%', description: '카드를 어떻게 놓을지입니다.' },
				},
				{
					name: 'rowHeight',
					type: 'select',
					required: true,
					defaultValue: 'medium',
					enumName: 'enum_block_row_height',
					options: [...ROW_HEIGHTS],
					admin: {
						width: '33%',
						description: '카드 줄의 높이입니다. 카드 폭은 각 카드의 비율에서 나옵니다.',
					},
				},
				{
					name: 'mark',
					type: 'select',
					required: true,
					defaultValue: 'none',
					enumName: 'enum_block_mark',
					options: [...BLOCK_MARKS],
					admin: {
						width: '33%',
						description: '모든 카드 판에 붙는 Do/OK/Don’t 표식입니다.',
					},
				},
			],
		},
		cardsField(),
		{
			name: 'assetDownload',
			type: 'checkbox',
			defaultValue: false,
			admin: { description: '이 블록에 연관 에셋 다운로드를 붙입니다.' },
		},
		guidelineRulesField(),
	]
}

/**
 * 슈거 블록용 — 기본 필드에 고정값을 덧씌운다. 슈거는 저작 편의를 위한 **사전 정의 블록**일 뿐이라
 * 새 필드를 만들지 않고, 미리 정한 값은 admin에서 숨긴다. 숨긴 필드도 저장 시 defaultValue가 채워진다.
 */
export function presetFields(
	fields: Field[],
	presets: Record<string, { defaultValue: unknown; hidden?: boolean }>,
): Field[] {
	return fields.map((field) => {
		if ('fields' in field && field.type === 'row') {
			return { ...field, fields: presetFields(field.fields, presets) }
		}
		if (!('name' in field) || !(field.name in presets)) return field
		const preset = presets[field.name]
		return {
			...field,
			defaultValue: preset.defaultValue,
			admin: { ...('admin' in field ? field.admin : {}), hidden: preset.hidden ?? true },
		} as Field
	})
}

// 제목에서 앵커를 뽑는다. Payload의 slugify는 `[^\w-]+`를 버려 한글 제목이 통째로 사라지므로
// 글자·숫자(\p{L}\p{N})를 남긴다 — `#키-레이아웃`도 프래그먼트로는 문제없이 동작한다.
export const titleToAnchor = (title: string): string =>
	title
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '')

/**
 * 섹션의 URL 앵커. 레지스트리에서 `anchor: true`인 블록에만 붙는다 — 좌측 TOC에 오르는 유일한 종류다.
 *
 * 🔴 localized가 아니다. 로케일마다 앵커가 갈리면 복사된 링크가 언어를 바꾸는 순간 끊긴다.
 * 🔴 required가 아닌 이유: 비우면 훅이 제목에서 채운다. required면 어드민이 저장 전 클라이언트 검증에서
 *    막아 훅까지 오지 못한다.
 * 🔴 이미 값이 있으면 손대지 않는다 — 앵커는 URL 정체성이라 제목을 고칠 때마다 다시 파생되면 밖에서
 *    공유한 `#앵커` 링크가 조용히 끊긴다.
 */
export function anchorField(): Field {
	return {
		name: 'anchor',
		type: 'text',
		hooks: {
			beforeValidate: [
				({ siblingData, value }) => {
					if (typeof value === 'string' && value.trim()) return value
					const title = (siblingData as { title?: unknown } | undefined)?.title
					// locale=all API 쓰기에서는 title이 로케일 객체다 — 그때는 채우지 않고 입력에 맡긴다.
					return typeof title === 'string' ? titleToAnchor(title) || value : value
				},
			],
		},
		admin: {
			description:
				'이 섹션의 URL 앵커입니다(예: key-layout). 비우면 제목에서 자동 생성합니다. 토픽 안에서 유일해야 합니다.',
		},
	}
}
