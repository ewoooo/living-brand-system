import type { FigmaRenderedAsset, FigmaSourceNode, IrNode } from './figma-ir'
import {
	createBoxStyle,
	createChildPlacementStyle,
	createContainerStyle,
	createTextStyle,
	findCssLowerableImageFill,
	lowerNodeBackground,
	roundCssNumber,
} from './lower-figma-visuals'

/**
 * 정규화(normalize): Figma 소스 트리 → IR 트리, 그리고 그 판단의 사전 단계인 에셋 계획.
 *
 * 파이프라인에서 "판단"을 소유하는 단계다 — 어떤 노드가 CSS로 못 그려져 렌더 에셋이 필요한지(plan),
 * 태그 선택(div/p/img), 비가시 노드 제거, 스타일 병합 순서, 렌더 에셋 치환을 여기서 전부 끝낸다.
 * emit은 결과 IR을 문자열화만 하고, 에셋 해석 I/O는 서비스가 소유한다.
 */

// 에셋 계획 — 노드별 "CSS로 표현 가능한가" 판정

const VECTOR_NODE_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'LINE',
	'ELLIPSE',
	'REGULAR_POLYGON',
])
const KNOWN_HTML_NODE_TYPES = new Set([
	'DOCUMENT',
	'CANVAS',
	'FRAME',
	'GROUP',
	'SECTION',
	'COMPONENT',
	'COMPONENT_SET',
	'INSTANCE',
	'RECTANGLE',
	'TEXT',
	'TRANSFORM_GROUP',
	// SLICE는 이번 범위에서 기존 동작을 유지한다.
	'SLICE',
])
/** CSS 배경으로 표현할 수 없는 paint — fill에서는 IMAGE가 빠진다(단일 IMAGE fill은 background-image로 lowering). */
const RASTER_FILL_PAINT_TYPES = new Set(['PATTERN', 'VIDEO', 'GRADIENT_ANGULAR'])
const RASTER_STROKE_PAINT_TYPES = new Set(['IMAGE', 'PATTERN', 'VIDEO', 'GRADIENT_ANGULAR'])
const CSS_EFFECT_TYPES = new Set(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR'])
const CSS_BLEND_MODES = new Set([
	'NORMAL',
	'PASS_THROUGH',
	'MULTIPLY',
	'SCREEN',
	'OVERLAY',
	'DARKEN',
	'LIGHTEN',
	'COLOR_DODGE',
	'COLOR_BURN',
	'HARD_LIGHT',
	'SOFT_LIGHT',
	'DIFFERENCE',
	'EXCLUSION',
	'HUE',
	'SATURATION',
	'COLOR',
	'LUMINOSITY',
])

/** Figma 렌더 API로 구워야 하는 노드(서브트리째 이미지가 된다)와 별도 해석이 필요한 IMAGE fill 목록. */
export interface FigmaAssetPlan {
	renders: { nodeId: string; name: string; format: 'png' | 'svg' }[]
	imageFills: { imageRef: string; name: string }[]
}

/** 트리를 훑어 에셋 계획을 만든다. 순수 함수 — 실제 렌더/다운로드 I/O는 서비스가 수행한다. */
export function planFigmaAssets(node: FigmaSourceNode): FigmaAssetPlan {
	const plan: FigmaAssetPlan = { renders: [], imageFills: [] }
	const seenImageRefs = new Set<string>()
	collectAssetRequests(node, plan, seenImageRefs)
	return plan
}

/**
 * 노드 하나의 에셋 필요를 판정한다.
 * 래스터 폴백 노드는 그 노드만 계획에 넣고 자식으로 내려가지 않는다(자식 픽셀이 렌더에 포함).
 * CSS로 그릴 수 있는 노드는 IMAGE fill의 imageRef만 수집하고 자식으로 재귀한다.
 */
function collectAssetRequests(
	node: FigmaSourceNode,
	plan: FigmaAssetPlan,
	seenImageRefs: Set<string>,
): void {
	if (node.visible === false || node.opacity === 0) return

	if (requiresRasterFallback(node)) {
		plan.renders.push({ nodeId: node.id, name: node.name ?? node.id, format: 'png' })
		return
	}
	if (VECTOR_NODE_TYPES.has(node.type)) {
		plan.renders.push({ nodeId: node.id, name: node.name ?? node.id, format: 'svg' })
		return
	}

	const imageFill = findCssLowerableImageFill(node)
	if (imageFill?.imageRef && !seenImageRefs.has(imageFill.imageRef)) {
		seenImageRefs.add(imageFill.imageRef)
		plan.imageFills.push({ imageRef: imageFill.imageRef, name: node.name ?? node.id })
	}

	for (const child of node.children ?? []) {
		collectAssetRequests(child, plan, seenImageRefs)
	}
}

/**
 * CSS로 충실히 표현할 수 없어 Figma 렌더(PNG)로 폴백해야 하는 노드인지 판정한다.
 * 단일 IMAGE fill은 background-image lowering이 담당하므로 여기서 걸리지 않는다 —
 * IMAGE가 있는데 lowering 불가(TEXT/다중 fill/imageRef 없음)인 조합만 래스터로 남는다.
 */
function requiresRasterFallback(node: FigmaSourceNode): boolean {
	if (
		node.type === 'TEXT_PATH' ||
		(!KNOWN_HTML_NODE_TYPES.has(node.type) &&
			!VECTOR_NODE_TYPES.has(node.type) &&
			!node.children?.length)
	) {
		return true
	}
	if (node.isMask || node.children?.some((child) => child.isMask)) return true

	const fills = (node.fills ?? []).filter((paint) => paint.visible !== false)
	const strokes = (node.strokes ?? []).filter((paint) => paint.visible !== false)
	if (strokes.length > 1 || strokes.some((paint) => RASTER_STROKE_PAINT_TYPES.has(paint.type))) {
		return true
	}
	if (fills.some((paint) => RASTER_FILL_PAINT_TYPES.has(paint.type))) return true
	if (fills.some((paint) => paint.type === 'IMAGE') && !findCssLowerableImageFill(node)) {
		return true
	}

	if (
		node.effects?.some(
			(effect) => effect.visible !== false && !CSS_EFFECT_TYPES.has(effect.type),
		)
	) {
		return true
	}
	if (node.blendMode && !CSS_BLEND_MODES.has(node.blendMode)) return true

	return !VECTOR_NODE_TYPES.has(node.type) && hasCssInexpressibleTransform(node)
}

/**
 * CSS로 옮길 수 없는 변형(스케일·기울임)인지 판정한다.
 * 순수 회전(항등 포함)은 rotate lowering이 표현하므로 래스터로 보내지 않는다 —
 * 회전 행렬은 a=d, b=-c, a²+b²=1을 만족하고, 그 밖의 행렬만 CSS 근사가 깨진다.
 */
function hasCssInexpressibleTransform(node: FigmaSourceNode): boolean {
	const transform = node.relativeTransform
	if (!transform) return false

	const [[a, b], [c, d]] = transform
	const epsilon = 0.000001
	const pureRotation =
		Math.abs(a - d) < epsilon &&
		Math.abs(b + c) < epsilon &&
		Math.abs(a * a + b * b - 1) < epsilon
	return !pureRotation
}

// IR 정규화

/** 루트 진입점: 소스 트리를 IR 트리로 정규화한다. 루트가 비가시면 null. */
export function normalizeFigmaNode(
	node: FigmaSourceNode,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>> = {},
	imageFillAssets: Readonly<Record<string, FigmaRenderedAsset>> = {},
): IrNode | null {
	return normalizeNode(node, null, true, renderedAssets, imageFillAssets)
}

/**
 * 노드 하나를 IrNode로 옮긴다. 스타일 병합 순서가 곧 우선순위다:
 * 컨테이너 레이아웃 → 박스 속성 → 텍스트/배경 → 자식 배치(마지막이 이긴다 — 절대배치 자식의
 * position:absolute가 컨테이너 기본 position:relative를 덮어쓰는 것이 의도).
 * 렌더 에셋이 있는 노드는 img 하나로 치환되고 자식은 그리지 않는다(에셋 픽셀에 이미 포함).
 */
function normalizeNode(
	node: FigmaSourceNode,
	parent: FigmaSourceNode | null,
	isRoot: boolean,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>>,
	imageFillAssets: Readonly<Record<string, FigmaRenderedAsset>>,
): IrNode | null {
	if (node.visible === false) return null

	const isText = node.type === 'TEXT'
	const renderedAsset = renderedAssets[node.id]
	const renderedBounds =
		renderedAsset && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}
	const background =
		renderedAsset || isText ? undefined : lowerNodeBackground(node, imageFillAssets)
	const box = renderedAsset ? {} : createBoxStyle(node)
	const placement = createChildPlacementStyle(node, parent, Boolean(renderedAsset))

	const style: IrNode['style'] = {
		'box-sizing': 'border-box',
		...(isRoot && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}),
		...(renderedAsset ? { display: 'block', ...renderedBounds } : createContainerStyle(node)),
		...box,
		// 컨테이너는 position:relative를 기본으로 둬 절대배치 자식의 기준 박스가 된다.
		// createChildPlacementStyle이 뒤에 병합되므로, 이 노드 자신이 절대배치면 position:absolute가 이겨 덮어쓴다.
		...(renderedAsset
			? {}
			: isText
				? createTextStyle(node)
				: { position: 'relative', ...background?.style }),
		...placement,
		// transform은 배치(translate 앵커)와 박스(rotate)가 각자 만들 수 있어 마지막에 합성한다 —
		// 스프레드 병합에 맡기면 한쪽이 다른 쪽을 undefined로 덮어쓴다.
		transform: [placement.transform, box.transform].filter(Boolean).join(' ') || undefined,
	}

	const children = renderedAsset
		? []
		: (node.children ?? [])
				.map((child) => normalizeNode(child, node, false, renderedAssets, imageFillAssets))
				.filter((child): child is IrNode => child !== null)

	return {
		id: node.id,
		name: node.name ?? '',
		figmaType: node.type,
		tag: renderedAsset ? 'img' : isText ? 'p' : 'div',
		style,
		text: !renderedAsset && isText ? (node.characters ?? '') : undefined,
		asset: renderedAsset,
		fillAsset: background?.fillAsset,
		children,
	}
}
