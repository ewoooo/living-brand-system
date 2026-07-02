import type { JsonRectElement, JsonTemplate, JsonTemplateElement } from '@/types/json-template'
import type { FigmaEffect, FigmaNode, FigmaPaint } from '../repositories/figma.rest.repository'

/**
 * Figma 노드 트리를 JsonTemplate으로 바꾸는 순수 변환기.
 * absoluteBoundingBox 기준으로 평탄화하므로 회전·auto-layout 정보는 보존하지 않는다.
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

/** PNG로 렌더해 영속화할 노드(IMAGE fill + 벡터 계열)의 id를 모은다. */
export function collectRenderableNodeIds(root: FigmaNode): string[] {
	const nodeIds: string[] = []

	const walk = (node: FigmaNode) => {
		if (node.visible === false) {
			return
		}
		if (node.fills?.some((fill) => fill.type === 'IMAGE' && fill.visible !== false)) {
			nodeIds.push(node.id)
			return
		}
		if (RENDER_AS_IMAGE_TYPES.has(node.type)) {
			nodeIds.push(node.id)
			return
		}
		for (const child of node.children ?? []) {
			walk(child)
		}
	}

	for (const child of root.children ?? []) {
		walk(child)
	}

	return nodeIds
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
				const style = child.style ?? {}
				const fontSize = Math.round(style.fontSize || 16)
				const text = child.characters ?? ''

				elements.push({
					id: nextId('text'),
					type: 'text',
					zIndex: nextZ(),
					...frame,
					text,
					fontSize,
					fontFamily: style.fontFamily || 'Pretendard',
					fontWeight: String(style.fontWeight || 400),
					color: extractFillCss(child.fills ?? []) || '#000000',
					lineHeight: style.lineHeightPx
						? style.lineHeightPx / fontSize
						: DEFAULT_LINE_HEIGHT,
					letterSpacing: style.letterSpacing || 0,
					textAlign: toTextAlign(style.textAlignHorizontal),
					// 슬롯 기본값: 텍스트는 교체 대상으로 연다.
					locked: false,
					slotLabel: text.trim().slice(0, TEXT_SLOT_LABEL_LENGTH) || '텍스트',
					...(effects.filter ? { filter: effects.filter } : {}),
				})
				continue
			}

			const isImageNode =
				child.fills?.some((fill) => fill.type === 'IMAGE' && fill.visible !== false) ||
				RENDER_AS_IMAGE_TYPES.has(child.type)

			if (isImageNode) {
				const asset = assets[child.id]

				// 렌더 실패 등으로 에셋이 없는 노드는 요소를 만들지 않는다 (호출자가 skipped로 보고).
				if (asset) {
					elements.push({
						id: nextId('image'),
						type: 'image',
						zIndex: nextZ(),
						...frame,
						assetId: asset.assetId,
						src: asset.src,
						objectFit: 'cover',
						borderRadius: child.cornerRadius ?? 0,
						locked: false,
						slotLabel: `이미지 ${++imageCounter}`,
						...(effects.boxShadow ? { boxShadow: effects.boxShadow } : {}),
						...(effects.filter ? { filter: effects.filter } : {}),
					})
				}
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

	walk(root)

	return {
		width: Math.round(rootBox.width),
		height: Math.round(rootBox.height),
		background: extractFillCss(root.fills ?? []) || '#ffffff',
		elements,
	}
}

function toTextAlign(value: string | undefined): 'left' | 'center' | 'right' {
	if (value === 'CENTER') return 'center'
	if (value === 'RIGHT') return 'right'
	return 'left'
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
