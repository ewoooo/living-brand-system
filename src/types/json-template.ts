import { z } from 'zod'

/**
 * Templates 컬렉션 jsonTemplate 필드의 데이터 계약.
 * template-import가 쓰고 template-renderer와 asset-generation이 읽는다.
 * Admin에서 json 필드를 직접 수정할 수 있으므로 읽기 쪽은 반드시 parse를 거친다.
 */

const baseElementSchema = z.object({
	id: z.string().min(1),
	x: z.number(),
	y: z.number(),
	width: z.number(),
	height: z.number(),
	zIndex: z.number(),
	// locked=false인 요소만 create 화면에서 슬롯으로 편집할 수 있다.
	locked: z.boolean(),
	slotLabel: z.string().optional(),
})

const textElementSchema = baseElementSchema.extend({
	type: z.literal('text'),
	text: z.string(),
	fontSize: z.number(),
	fontFamily: z.string(),
	fontWeight: z.string(),
	color: z.string(),
	lineHeight: z.number(),
	letterSpacing: z.number(),
	textAlign: z.enum(['left', 'center', 'right']),
	// 슬롯 텍스트가 원본과 길이가 다를 때의 상자 동작.
	// fixed는 폭 고정(줄바꿈), auto-width는 줄바꿈 없이 폭이 텍스트를 따라간다.
	textFit: z.enum(['fixed', 'auto-width']).default('fixed'),
	// 줄바꿈으로 늘어날 때 상자 안에서 쌓이는 기준. bottom은 아래 변 고정 — 넘치면 위로 자란다.
	verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top'),
	// /create 슬롯 입력 제약 — 제작자가 admin에서 요소별로 설정한다.
	maxLength: z.number().int().positive().optional(),
	maxLines: z.number().int().positive().optional(),
	inputFormat: z.enum(['free', 'number', 'email', 'date']).default('free'),
	filter: z.string().optional(),
})

/** 이미지 요소가 참조할 수 있는 인가된 내부 에셋 컬렉션. */
export const AUTHORIZED_ASSET_COLLECTIONS = ['brand-logos', 'application-images'] as const

/**
 * 이미지 출처 컬렉션. 'template-assets'는 임포트 직후의 비인가 스테이징 상태이며,
 * 인가 컬렉션으로 교체하기 전에는 Templates 문서를 저장할 수 없다.
 */
const assetCollectionSchema = z.enum(['template-assets', ...AUTHORIZED_ASSET_COLLECTIONS])

const imageElementSchema = baseElementSchema.extend({
	type: z.literal('image'),
	// 참조 에셋의 컬렉션과 문서 ID. 렌더는 src를 그대로 쓴다.
	// 기존 데이터 호환: assetCollection이 없으면 비인가 스테이징으로 간주한다.
	assetCollection: assetCollectionSchema.default('template-assets'),
	assetId: z.number(),
	src: z.string().min(1),
	objectFit: z.enum(['cover', 'contain', 'fill']),
	borderRadius: z.number(),
	boxShadow: z.string().optional(),
	filter: z.string().optional(),
})

const rectElementSchema = baseElementSchema.extend({
	type: z.literal('rect'),
	fill: z.string(),
	opacity: z.number(),
	borderRadius: z.number(),
	boxShadow: z.string().optional(),
	filter: z.string().optional(),
})

export const jsonTemplateSchema = z.object({
	width: z.number().positive(),
	height: z.number().positive(),
	background: z.string(),
	elements: z.array(
		z.discriminatedUnion('type', [textElementSchema, imageElementSchema, rectElementSchema]),
	),
})

export type JsonTemplate = z.infer<typeof jsonTemplateSchema>
export type JsonTemplateElement = JsonTemplate['elements'][number]
export type JsonRectElement = z.infer<typeof rectElementSchema>
