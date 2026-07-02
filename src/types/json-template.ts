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
	filter: z.string().optional(),
})

const imageElementSchema = baseElementSchema.extend({
	type: z.literal('image'),
	// template-assets 문서 ID. 수명주기 관리용이며 렌더는 src를 그대로 쓴다.
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
export type JsonTextElement = z.infer<typeof textElementSchema>
export type JsonImageElement = z.infer<typeof imageElementSchema>
export type JsonRectElement = z.infer<typeof rectElementSchema>
