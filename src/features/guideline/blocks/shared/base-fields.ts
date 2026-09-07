import type { Field } from 'payload'
import { cardsField } from '@/features/guideline/cards/schema'
import { baseBlockFields } from './fields'

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

/**
 * 기본 블록의 필드. 블록의 책임은 다섯이다(2026-09-07 모델): 카드 레이아웃, 제목·설명, 에셋 다운로드 유무,
 * rules, 그리고 앵커(섹션만 — 여기 없다). 그 밖의 것은 카드가 갖는다.
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
					admin: { width: '50%', description: '카드를 어떻게 놓을지입니다.' },
				},
				{
					name: 'rowHeight',
					type: 'select',
					required: true,
					defaultValue: 'medium',
					enumName: 'enum_block_row_height',
					options: [...ROW_HEIGHTS],
					admin: {
						width: '50%',
						description: '카드 줄의 높이입니다. 카드 폭은 각 카드의 비율에서 나옵니다.',
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
		...baseBlockFields(),
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
