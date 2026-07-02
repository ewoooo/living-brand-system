import type {
	JsonFlowElement,
	JsonRectElement,
	JsonTemplate,
	JsonTemplateElement,
} from '@/types/json-template'
import type { FigmaEffect, FigmaNode, FigmaPaint } from '../repositories/figma.rest.repository'

/**
 * Figma 노드 트리를 JsonTemplate으로 바꾸는 순수 변환기.
 * 기본은 absoluteBoundingBox 기준 평탄화(절대좌표 스냅샷)이고,
 * 슬롯을 품은 auto-layout 프레임은 stack 요소로 승격해 flow 규칙을 보존한다. 회전은 보존하지 않는다.
 * 외부 I/O 없음 — 영속화된 에셋 맵은 호출자(import service)가 만들어 넘긴다.
 */

/** 이 타입들은 개별 도형 파싱 대신 Figma 렌더 PNG를 이미지 요소로 쓴다. */
const RENDER_AS_IMAGE_TYPES = new Set([
	'VECTOR',
	'LINE',
	'ELLIPSE',
	'POLYGON',
	'STAR',
	'BOOLEAN_OPERATION',
])

const CONTAINER_TYPES = new Set(['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'])

const TEXT_SLOT_LABEL_LENGTH = 20
const DEFAULT_LINE_HEIGHT = 1.3

export interface ImportedAsset {
	assetId: number
	src: string
}

export interface RenderableNodeIds {
	/** 사진 등 IMAGE fill 노드 — PNG(scale=2)로 렌더한다. */
	imageFillNodeIds: string[]
	/** 벡터 계열 노드 — SVG로 렌더해 벡터를 보존한다. */
	vectorNodeIds: string[]
}

/** 렌더해서 영속화할 노드의 id를 포맷별로 모은다. */
export function collectRenderableNodeIds(root: FigmaNode): RenderableNodeIds {
	const imageFillNodeIds: string[] = []
	const vectorNodeIds: string[] = []

	const walk = (node: FigmaNode) => {
		if (node.visible === false) {
			return
		}
		if (node.fills?.some((fill) => fill.type === 'IMAGE' && fill.visible !== false)) {
			imageFillNodeIds.push(node.id)
			return
		}
		if (RENDER_AS_IMAGE_TYPES.has(node.type)) {
			vectorNodeIds.push(node.id)
			return
		}
		for (const child of node.children ?? []) {
			walk(child)
		}
	}

	for (const child of root.children ?? []) {
		walk(child)
	}

	return { imageFillNodeIds, vectorNodeIds }
}

export function convertFigmaNodeTree(
	root: FigmaNode,
	assets: Record<string, ImportedAsset>,
): JsonTemplate {
	const rootBox = root.absoluteBoundingBox

	if (!rootBox) {
		throw new Error('Figma root node has no absoluteBoundingBox.')
	}

	const elements: JsonTemplateElement[] = []
	let idCounter = 0
	let zCounter = 0
	let imageCounter = 0
	const nextId = (prefix: string) => `${prefix}_${++idCounter}`
	const nextZ = () => ++zCounter

	// 스택 자식은 흐름이 배치하므로 좌표 없이 크기 모드만 승계한다. 순서는 Figma 자식 순서 그대로.
	const convertFlowChildren = (node: FigmaNode): JsonFlowElement[] =>
		(node.children ?? []).flatMap((child): JsonFlowElement[] => {
			const box = child.absoluteBoundingBox

			if (!box || child.visible === false) {
				return []
			}

			const size = {
				width: Math.round(box.width),
				height: Math.round(box.height),
				widthMode: toSizeMode(child.layoutSizingHorizontal),
				heightMode: toSizeMode(child.layoutSizingVertical),
			}

			if (child.type === 'TEXT') {
				return [{ id: nextId('text'), ...size, ...textPropsFromNode(child) }]
			}

			if (isImageLikeNode(child)) {
				const asset = assets[child.id]

				return asset
					? [
							{
								id: nextId('image'),
								...size,
								...imagePropsFromNode(child, asset, `이미지 ${++imageCounter}`),
							},
						]
					: []
			}

			if (CONTAINER_TYPES.has(child.type) && isAutoLayout(child)) {
				return [
					{
						id: nextId('stack'),
						locked: true,
						...size,
						...stackPropsFromNode(child),
						children: convertFlowChildren(child),
					},
				]
			}

			if (child.type === 'RECTANGLE') {
				const fill = extractFillCss(child.fills ?? [])
				const effects = extractEffectsCss(child.effects ?? [])

				return fill
					? [
							{
								id: nextId('rect'),
								type: 'rect',
								locked: true,
								...size,
								fill,
								opacity: child.opacity ?? 1,
								borderRadius: child.cornerRadius ?? 0,
								...(effects.boxShadow ? { boxShadow: effects.boxShadow } : {}),
								...(effects.filter ? { filter: effects.filter } : {}),
							},
						]
					: []
			}

			return []
		})

	const walk = (node: FigmaNode) => {
		for (const child of node.children ?? []) {
			const box = child.absoluteBoundingBox

			if (!box || child.visible === false) {
				continue
			}

			const frame = {
				x: Math.round(box.x - rootBox.x),
				y: Math.round(box.y - rootBox.y),
				width: Math.round(box.width),
				height: Math.round(box.height),
			}
			const effects = extractEffectsCss(child.effects ?? [])

			if (child.type === 'TEXT') {
				elements.push({
					id: nextId('text'),
					zIndex: nextZ(),
					...frame,
					...textPropsFromNode(child),
				})
				continue
			}

			if (isImageLikeNode(child)) {
				const asset = assets[child.id]

				// 렌더 실패 등으로 에셋이 없는 노드는 요소를 만들지 않는다 (호출자가 skipped로 보고).
				if (asset) {
					elements.push({
						id: nextId('image'),
						zIndex: nextZ(),
						...frame,
						...imagePropsFromNode(child, asset, `이미지 ${++imageCounter}`),
					})
				}
				continue
			}

			// 슬롯을 품고 flow로 표현 가능한 auto-layout 프레임은 stack으로 승격한다.
			if (CONTAINER_TYPES.has(child.type) && isPromotableStack(child)) {
				elements.push({
					id: nextId('stack'),
					zIndex: nextZ(),
					...frame,
					locked: true,
					...stackPropsFromNode(child),
					children: convertFlowChildren(child),
				})
				continue
			}

			if (child.type === 'RECTANGLE' || CONTAINER_TYPES.has(child.type)) {
				const fill = extractFillCss(child.fills ?? [])

				if (fill) {
					const rect: JsonRectElement = {
						id: nextId('rect'),
						type: 'rect',
						zIndex: nextZ(),
						...frame,
						fill,
						opacity: child.opacity ?? 1,
						borderRadius: child.cornerRadius ?? 0,
						// 슬롯 기본값: 배경·장식은 고정한다.
						locked: true,
						...(effects.boxShadow ? { boxShadow: effects.boxShadow } : {}),
						...(effects.filter ? { filter: effects.filter } : {}),
					}
					elements.push(rect)
				}

				if (CONTAINER_TYPES.has(child.type)) {
					walk(child)
				}
			}
		}
	}

	const width = Math.round(rootBox.width)
	const height = Math.round(rootBox.height)
	const background = extractFillCss(root.fills ?? []) || '#ffffff'

	// 루트 자체가 승격 가능한 auto-layout이면 캔버스 크기의 스택 하나로 표현한다.
	if (isPromotableStack(root)) {
		return {
			width,
			height,
			background,
			elements: [
				{
					id: nextId('stack'),
					zIndex: nextZ(),
					x: 0,
					y: 0,
					width,
					height,
					locked: true,
					...stackPropsFromNode(root),
					children: convertFlowChildren(root),
				},
			],
		}
	}

	walk(root)

	return { width, height, background, elements }
}

function isAutoLayout(node: FigmaNode): boolean {
	return node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL'
}

function isImageLikeNode(node: FigmaNode): boolean {
	return (
		node.fills?.some((fill) => fill.type === 'IMAGE' && fill.visible !== false) ||
		RENDER_AS_IMAGE_TYPES.has(node.type)
	)
}

/**
 * auto-layout 프레임을 stack으로 승격할 수 있는지 판정한다.
 * 슬롯 후보(텍스트·이미지)가 없으면 평탄화로 충분하고,
 * 하위에 auto-layout이 아닌 컨테이너가 섞여 있으면 flow로 표현할 수 없어 승격하지 않는다.
 */
function isPromotableStack(node: FigmaNode): boolean {
	return isAutoLayout(node) && hasSlotCandidate(node) && isFlowRepresentable(node)
}

function hasSlotCandidate(node: FigmaNode): boolean {
	return (node.children ?? []).some((child) => {
		if (child.visible === false) {
			return false
		}

		return child.type === 'TEXT' || isImageLikeNode(child) || hasSlotCandidate(child)
	})
}

function isFlowRepresentable(node: FigmaNode): boolean {
	return (node.children ?? []).every((child) => {
		if (child.visible === false) {
			return true
		}
		if (child.type === 'TEXT' || isImageLikeNode(child) || child.type === 'RECTANGLE') {
			return true
		}
		if (CONTAINER_TYPES.has(child.type)) {
			return isAutoLayout(child) && isFlowRepresentable(child)
		}

		return true
	})
}

function textPropsFromNode(node: FigmaNode) {
	const style = node.style ?? {}
	const fontSize = Math.round(style.fontSize || 16)
	const text = node.characters ?? ''
	const effects = extractEffectsCss(node.effects ?? [])

	return {
		type: 'text' as const,
		text,
		fontSize,
		fontFamily: style.fontFamily || 'Pretendard',
		fontWeight: String(style.fontWeight || 400),
		color: extractFillCss(node.fills ?? []) || '#000000',
		lineHeight: style.lineHeightPx ? style.lineHeightPx / fontSize : DEFAULT_LINE_HEIGHT,
		letterSpacing: style.letterSpacing || 0,
		textAlign: toTextAlign(style.textAlignHorizontal),
		// Figma에서 auto-width로 그린 텍스트는 줄바꿈 없는 상자로 승계한다.
		textFit: (style.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'auto-width' : 'fixed') as
			| 'auto-width'
			| 'fixed',
		verticalAlign: toVerticalAlign(style.textAlignVertical),
		inputFormat: 'free' as const,
		// 슬롯 기본값: 텍스트는 교체 대상으로 연다.
		locked: false,
		slotLabel: text.trim().slice(0, TEXT_SLOT_LABEL_LENGTH) || '텍스트',
		...(effects.filter ? { filter: effects.filter } : {}),
	}
}

function imagePropsFromNode(node: FigmaNode, asset: ImportedAsset, slotLabel: string) {
	const effects = extractEffectsCss(node.effects ?? [])

	return {
		type: 'image' as const,
		// 임포트 조각은 비인가 스테이징 — 저장 전에 인가 에셋으로 교체해야 한다.
		assetCollection: 'template-assets' as const,
		assetId: asset.assetId,
		src: asset.src,
		objectFit: 'cover' as const,
		borderRadius: node.cornerRadius ?? 0,
		locked: false,
		slotLabel,
		...(effects.boxShadow ? { boxShadow: effects.boxShadow } : {}),
		...(effects.filter ? { filter: effects.filter } : {}),
	}
}

function stackPropsFromNode(node: FigmaNode) {
	const justify = toJustify(node.primaryAxisAlignItems)

	return {
		type: 'stack' as const,
		direction: (node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical') as
			| 'horizontal'
			| 'vertical',
		// space-between이면 Figma의 itemSpacing이 배치에 관여하지 않으므로 0으로 둔다.
		gap: justify === 'space-between' ? 0 : (node.itemSpacing ?? 0),
		padding: {
			top: node.paddingTop ?? 0,
			right: node.paddingRight ?? 0,
			bottom: node.paddingBottom ?? 0,
			left: node.paddingLeft ?? 0,
		},
		justify,
		align: toAlign(node.counterAxisAlignItems),
	}
}

function toJustify(value: string | undefined): 'start' | 'center' | 'end' | 'space-between' {
	if (value === 'CENTER') return 'center'
	if (value === 'MAX') return 'end'
	if (value === 'SPACE_BETWEEN') return 'space-between'
	return 'start'
}

function toAlign(value: string | undefined): 'start' | 'center' | 'end' {
	if (value === 'CENTER') return 'center'
	if (value === 'MAX') return 'end'
	return 'start'
}

function toSizeMode(value: string | undefined): 'fixed' | 'hug' | 'fill' {
	if (value === 'HUG') return 'hug'
	if (value === 'FILL') return 'fill'
	return 'fixed'
}

function toTextAlign(value: string | undefined): 'left' | 'center' | 'right' {
	if (value === 'CENTER') return 'center'
	if (value === 'RIGHT') return 'right'
	return 'left'
}

function toVerticalAlign(value: string | undefined): 'top' | 'middle' | 'bottom' {
	if (value === 'CENTER') return 'middle'
	if (value === 'BOTTOM') return 'bottom'
	return 'top'
}

function colorToCss(
	color: { r: number; g: number; b: number; a?: number },
	opacity?: number,
): string {
	const r = Math.round((color.r ?? 0) * 255)
	const g = Math.round((color.g ?? 0) * 255)
	const b = Math.round((color.b ?? 0) * 255)
	const a = opacity ?? color.a ?? 1

	if (a < 1) {
		return `rgba(${r},${g},${b},${Number(a).toFixed(2)})`
	}

	return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

/**
 * CSS linear-gradient 각도로 변환한다.
 * Figma handles[0]=start, handles[1]=end (정규화 좌표), CSS 0deg=위쪽 기준이라 +90 보정.
 */
function gradientAngle(handles: { x: number; y: number }[]): number {
	if (!handles || handles.length < 2) {
		return 180
	}

	const dx = (handles[1]?.x ?? 0) - (handles[0]?.x ?? 0)
	const dy = (handles[1]?.y ?? 1) - (handles[0]?.y ?? 0)
	const deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90

	return Math.round(((deg % 360) + 360) % 360)
}

function paintToCss(paint: FigmaPaint): string | null {
	if (paint.visible === false) {
		return null
	}
	if (paint.type === 'SOLID') {
		return paint.color ? colorToCss(paint.color, paint.opacity) : null
	}

	const stops = paint.gradientStops ?? []

	if (stops.length === 0) {
		return null
	}

	const stopsCss = stops
		.map((stop) => `${colorToCss(stop.color)} ${Math.round((stop.position ?? 0) * 100)}%`)
		.join(', ')

	if (paint.type === 'GRADIENT_RADIAL') {
		return `radial-gradient(circle, ${stopsCss})`
	}
	if (
		paint.type === 'GRADIENT_LINEAR' ||
		paint.type === 'GRADIENT_ANGULAR' ||
		paint.type === 'GRADIENT_DIAMOND'
	) {
		// ANGULAR/DIAMOND는 linear 근사로 처리한다.
		return `linear-gradient(${gradientAngle(paint.gradientHandlePositions ?? [])}deg, ${stopsCss})`
	}

	return null
}

/** 첫 번째 visible paint를 CSS로. IMAGE fill은 별도 이미지 경로가 처리하므로 건너뛴다. */
function extractFillCss(fills: FigmaPaint[]): string | null {
	for (const fill of fills) {
		if (fill.visible === false || fill.type === 'IMAGE') {
			continue
		}

		const css = paintToCss(fill)

		if (css) {
			return css
		}
	}

	return null
}

function extractEffectsCss(effects: FigmaEffect[]): { boxShadow?: string; filter?: string } {
	const shadows: string[] = []
	const filters: string[] = []

	for (const effect of effects) {
		if (effect.visible === false) {
			continue
		}
		if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
			const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : ''
			const x = Math.round(effect.offset?.x ?? 0)
			const y = Math.round(effect.offset?.y ?? 0)
			const blur = Math.round(effect.radius ?? 0)
			const spread = Math.round(effect.spread ?? 0)
			const color = effect.color ? colorToCss(effect.color) : 'rgba(0,0,0,0.25)'
			shadows.push(`${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`)
		} else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
			filters.push(`blur(${Math.round(effect.radius ?? 0)}px)`)
		}
	}

	return {
		...(shadows.length ? { boxShadow: shadows.join(', ') } : {}),
		...(filters.length ? { filter: filters.join(' ') } : {}),
	}
}
