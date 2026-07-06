import { z } from 'zod'

/**
 * Templates 컬렉션 jsonTemplate 필드의 데이터 계약.
 * template-import가 쓰고 template-renderer와 asset-generation이 읽는다.
 * Admin에서 json 필드를 직접 수정할 수 있으므로 읽기 쪽은 반드시 parse를 거친다.
 *
 * 배치 모델은 두 층이다:
 * - elements(최상위): 절대좌표(x/y) 배치. stack 요소 자신도 절대좌표 박스다.
 * - stack.children: 흐름(flow) 배치 — 좌표 없이 스택 규칙(direction/gap/justify)이 위치를 정한다.
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

const textPropsShape = {
	type: z.literal('text'),
	text: z.string(),
	fontSize: z.number(),
	fontFamily: z.string(),
	fontWeight: z.string(),
	color: z.string(),
	lineHeight: z.number(),
	letterSpacing: z.number(),
	textAlign: z.enum(['left', 'center', 'right']),
	// 슬롯 텍스트가 원본과 길이가 다를 때의 상자 동작. fixed는 폭 고정(줄바꿈),
	// auto-width는 줄바꿈 없이 폭이 텍스트를 따라가고, truncate는 상자를 넘치는 줄을 말줄임(…)한다.
	textFit: z.enum(['fixed', 'auto-width', 'truncate']).default('fixed'),
	// 줄바꿈으로 늘어날 때 상자 안에서 쌓이는 기준. bottom은 아래 변 고정 — 넘치면 위로 자란다.
	verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top'),
	// /create 슬롯 입력 제약 — 제작자가 admin에서 요소별로 설정한다.
	maxLength: z.number().int().positive().optional(),
	maxLines: z.number().int().positive().optional(),
	inputFormat: z.enum(['free', 'number', 'email', 'date']).default('free'),
	filter: z.string().optional(),
}

/** 이미지 요소가 참조할 수 있는 인가된 내부 에셋 컬렉션. */
export const AUTHORIZED_ASSET_COLLECTIONS = ['brand-logos', 'application-images'] as const

/**
 * 이미지 출처 컬렉션. 'template-assets'는 임포트 직후의 비인가 스테이징 상태이며,
 * 인가 컬렉션으로 교체하기 전에는 Templates 문서를 저장할 수 없다.
 */
const assetCollectionSchema = z.enum(['template-assets', ...AUTHORIZED_ASSET_COLLECTIONS])

const imagePropsShape = {
	type: z.literal('image'),
	// 참조 에셋의 컬렉션과 문서 ID. 렌더는 src를 그대로 쓴다.
	// 기존 데이터 호환: assetCollection이 없으면 비인가 스테이징으로 간주한다.
	assetCollection: assetCollectionSchema.default('template-assets'),
	assetId: z.number(),
	src: z.string().min(1),
	objectFit: z.enum(['cover', 'contain', 'fill']),
	borderRadius: z.number(),
	boxShadow: z.string().optional(),
	color: z.string().optional(),
	filter: z.string().optional(),
}

const rectPropsShape = {
	type: z.literal('rect'),
	fill: z.string(),
	opacity: z.number(),
	borderRadius: z.number(),
	boxShadow: z.string().optional(),
	filter: z.string().optional(),
}

const textElementSchema = baseElementSchema.extend(textPropsShape)
const imageElementSchema = baseElementSchema.extend(imagePropsShape)
const rectElementSchema = baseElementSchema.extend(rectPropsShape)

/** 스택 자식의 크기 결정 방식. hug는 내용 크기, fill은 남은 공간 채움(flex-grow). */
const sizeModeSchema = z.enum(['fixed', 'hug', 'fill'])

// 스택 자식은 흐름이 배치하므로 좌표(x/y/zIndex) 대신 크기 모드를 가진다.
// width/height는 임포트 시점 스냅샷이며 mode가 fixed일 때만 렌더에 적용된다.
const flowBaseSchema = z.object({
	id: z.string().min(1),
	locked: z.boolean(),
	slotLabel: z.string().optional(),
	width: z.number(),
	height: z.number(),
	widthMode: sizeModeSchema.default('fixed'),
	heightMode: sizeModeSchema.default('fixed'),
})

// Figma auto-layout 매핑: layoutMode→direction, itemSpacing→gap,
// primaryAxisAlignItems→justify, counterAxisAlignItems→align.
const stackLayoutShape = {
	type: z.literal('stack'),
	direction: z.enum(['horizontal', 'vertical']),
	gap: z.number(),
	padding: z.object({
		top: z.number(),
		right: z.number(),
		bottom: z.number(),
		left: z.number(),
	}),
	justify: z.enum(['start', 'center', 'end', 'space-between']).default('start'),
	align: z.enum(['start', 'center', 'end']).default('start'),
	// 원본 프레임의 배경 — 평탄화 경로의 rect 보존과 동일한 역할.
	fill: z.string().optional(),
}

const flowTextSchema = z.object({ ...flowBaseSchema.shape, ...textPropsShape })
const flowImageSchema = z.object({ ...flowBaseSchema.shape, ...imagePropsShape })
const flowRectSchema = z.object({ ...flowBaseSchema.shape, ...rectPropsShape })

// 재귀(스택 안의 스택)는 Zod 4 getter로 표현한다 — 스키마가 ZodObject로 남고 타입이 추론된다.
// getter 반환 타입은 순환 참조라 추론이 안 되고(TS7022), 명시하려면 interface로
// 지연 해석해야 한다 — type alias나 인라인 주석은 TS2502로 다시 순환에 걸린다.
interface FlowChildrenSchema
	extends z.ZodArray<
		z.ZodUnion<
			readonly [
				typeof flowTextSchema,
				typeof flowImageSchema,
				typeof flowRectSchema,
				typeof flowStackSchema,
			]
		>
	> {}

const flowStackSchema = z.object({
	...flowBaseSchema.shape,
	...stackLayoutShape,
	get children(): FlowChildrenSchema {
		return z.array(flowElementSchema)
	},
})

const flowElementSchema = z.union([
	flowTextSchema,
	flowImageSchema,
	flowRectSchema,
	flowStackSchema,
])

const stackElementSchema = z.object({
	...baseElementSchema.shape,
	...stackLayoutShape,
	children: z.array(flowElementSchema),
})

export const jsonTemplateSchema = z.object({
	width: z.number().positive(),
	height: z.number().positive(),
	background: z.string(),
	elements: z.array(
		z.discriminatedUnion('type', [
			textElementSchema,
			imageElementSchema,
			rectElementSchema,
			stackElementSchema,
		]),
	),
})

export type JsonTemplate = z.infer<typeof jsonTemplateSchema>
export type JsonTemplateElement = JsonTemplate['elements'][number]
export type JsonRectElement = z.infer<typeof rectElementSchema>
export type JsonStackElement = z.infer<typeof stackElementSchema>
export type JsonFlowElement = z.infer<typeof flowElementSchema>

export type JsonSlotElement = Exclude<JsonFlowElement | JsonTemplateElement, { type: 'stack' }>

/**
 * 열린 슬롯(locked=false) 요소를 스택 자식까지 재귀로 모은다. 스택 자체는 슬롯이 아니다.
 * 슬롯을 소비하는 모든 곳(/create, 에이전트 툴)이 이 하나를 쓴다 — 순회 규칙이 갈라지면 안 된다.
 */
export function collectOpenSlotElements(
	elements: readonly (JsonFlowElement | JsonTemplateElement)[],
): JsonSlotElement[] {
	return elements.flatMap((element) => {
		if (element.type === 'stack') {
			return collectOpenSlotElements(element.children)
		}

		return element.locked ? [] : [element]
	})
}
