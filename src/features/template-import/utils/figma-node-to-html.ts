import type {
	FigmaEffect,
	FigmaNode,
	FigmaPaint,
} from '@/features/template-import/repositories/figma.rest.repository'

/**
 * Figma REST 노드 트리 → inline-style HTML 문자열.
 *
 * 원칙: 재해석하지 않는다. Figma가 노드에 실어 주는 속성을 CSS로 "그대로" 옮기는 것이 목표이고,
 * 그래서 특정 속성만 골라 담지 않고 Dev Mode 인스펙트에 나타나는 시각 속성 전부(레이아웃/박스/타이포)를
 * naive하게 매핑한다. 디자인이 이상해 보이면 디자이너가 Figma에서 고치고, 변환 결과가 원본과 "다르면"
 * 그건 이 파일의 버그다.
 *
 * 런타임(DB 저장 HTML)에서 그대로 떠야 하므로 Tailwind가 아니라 inline style로 굳힌다.
 * div=프레임/그룹/셰이프, p=텍스트, img=Figma 렌더 에셋. Figma 노드 타입은 data-figma-type으로 보존한다(레이어 패널용).
 */

// Figma REST 변환 모델

interface FigmaGradientPaint extends FigmaPaint {
	gradientStops?: { color: { r: number; g: number; b: number; a?: number }; position?: number }[]
	gradientHandlePositions?: { x: number; y: number }[]
}

type TextStyle = NonNullable<FigmaNode['style']> & {
	italic?: boolean
	fontStyle?: string
	textCase?: string
	textDecoration?: string
	lineHeightUnit?: string
	lineHeightPercentFontSize?: number
}

interface Node extends Omit<FigmaNode, 'style'> {
	style?: TextStyle
	background?: FigmaPaint[]
	backgroundColor?: { r: number; g: number; b: number; a?: number }
	// 회전/스케일 이전의 실제 치수. absoluteBoundingBox(AABB)는 회전 시 커지므로 치수는 size를 우선한다.
	size?: { width: number; height: number }
	opacity?: number
	rotation?: number
	blendMode?: string
	clipsContent?: boolean
	cornerRadius?: number
	rectangleCornerRadii?: number[]
	strokes?: FigmaPaint[]
	strokeWeight?: number
	individualStrokeWeights?: { top: number; right: number; bottom: number; left: number }
	// 레이아웃 컨테이너
	itemSpacing?: number
	counterAxisSpacing?: number
	counterAxisAlignContent?: string
	layoutWrap?: string
	gridColumnGap?: number
	gridRowGap?: number
	gridColumnsSizing?: string
	gridRowsSizing?: string
	gridItemsPositioning?: string
	// 자식 배치
	layoutGrow?: number
	layoutAlign?: string
	layoutPositioning?: string
	gridColumnAnchorIndex?: number
	gridRowAnchorIndex?: number
	gridColumnSpan?: number
	gridRowSpan?: number
	gridChildHorizontalAlign?: string
	gridChildVerticalAlign?: string
	children?: Node[]
}

export interface FigmaHtmlResult {
	html: string
	width: number
	height: number
}

export interface FigmaRenderedAsset {
	collection: 'application-images'
	id: number
	url: string
}

// CSS 값 변환

const roundCssNumber = (n: number) => Math.round(n * 100) / 100

function formatRgba(
	color?: { r: number; g: number; b: number; a?: number },
	opacity = 1,
): string | undefined {
	if (!color) return undefined
	const c = (v: number) => Math.round(v * 255)
	const a = roundCssNumber((color.a ?? 1) * opacity)
	return a >= 1
		? `rgb(${c(color.r)},${c(color.g)},${c(color.b)})`
		: `rgba(${c(color.r)},${c(color.g)},${c(color.b)},${a})`
}

const isVisible = (p: { visible?: boolean }) => p.visible !== false

// SOLID 페인트 → 색. gradient/image는 background()가 따로 처리.
function findSolidColor(paints?: FigmaPaint[]): string | undefined {
	const p = paints?.find((x) => x.type === 'SOLID' && isVisible(x))
	return p ? formatRgba(p.color, p.opacity ?? 1) : undefined
}

// linear/radial gradient → CSS. 색 정지점은 정확하고, paint 불투명도를 정지점 알파에 곱한다.
// ponytail: linear 각도는 핸들 벡터 근사. radial/diamond는 CSS 기본(중앙 ellipse)으로 근사 — 중심/반경/모양 핸들은 무시. 편차 나면 여기 보정.
function createGradientCss(paint: FigmaGradientPaint): string | undefined {
	const stops = paint.gradientStops
	if (!stops?.length) return undefined
	const op = paint.opacity ?? 1
	const stopStr = stops
		.map((s) => `${formatRgba(s.color, op)} ${roundCssNumber((s.position ?? 0) * 100)}%`)
		.join(',')
	if (paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_DIAMOND') {
		return `radial-gradient(${stopStr})`
	}
	// GRADIENT_LINEAR: 시작→끝 핸들로 각도(0deg=위, 시계방향). y축은 아래로 증가.
	const h = paint.gradientHandlePositions
	let angle = 180
	if (h && h.length >= 2) {
		const dx = h[1].x - h[0].x
		const dy = h[1].y - h[0].y
		angle = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI)
	}
	return `linear-gradient(${angle}deg,${stopStr})`
}

// 시각 스타일 변환

// 컨테이너 배경: fills(모던) → background(레거시) → backgroundColor 순. gradient도 지원.
// ponytail: 첫 번째 보이는 paint만 쓴다(스택된 fill 미합성). IMAGE fill은 픽셀이라 배경 없이 남긴다(에셋 배선은 별도 슬라이스).
function resolveBackgroundValue(node: Node): string | undefined {
	const paints = node.fills?.length ? node.fills : node.background
	const paint = paints?.find(isVisible)
	if (paint) {
		if (paint.type === 'SOLID') return formatRgba(paint.color, paint.opacity ?? 1)
		if (paint.type.startsWith('GRADIENT')) return createGradientCss(paint)
	}
	return formatRgba(node.backgroundColor)
}

// strokes → border. 개별 두께가 있으면 변별 두께로.
// ponytail: strokeAlign(INSIDE/OUTSIDE/CENTER)은 무시하고 border-box border(=INSIDE)로 근사. OUTSIDE/CENTER는 CSS border로 충실 표현 불가.
function createBorderStyle(node: Node): Record<string, string | undefined> {
	const color = findSolidColor(node.strokes)
	if (!color) return {}
	const iw = node.individualStrokeWeights
	if (iw) {
		return {
			'border-style': 'solid',
			'border-color': color,
			'border-top-width': `${roundCssNumber(iw.top)}px`,
			'border-right-width': `${roundCssNumber(iw.right)}px`,
			'border-bottom-width': `${roundCssNumber(iw.bottom)}px`,
			'border-left-width': `${roundCssNumber(iw.left)}px`,
		}
	}
	return { border: `${roundCssNumber(node.strokeWeight ?? 1)}px solid ${color}` }
}

// effects → box-shadow(그림자) + filter(레이어 블러) + backdrop-filter(배경 블러).
function createEffectStyle(effects?: FigmaEffect[]): Record<string, string | undefined> {
	if (!effects?.length) return {}
	const shadows: string[] = []
	let filter: string | undefined
	let backdrop: string | undefined
	for (const e of effects) {
		if (e.visible === false) continue
		const o = e.offset ?? { x: 0, y: 0 }
		const color = formatRgba(e.color) ?? 'rgba(0,0,0,0.25)'
		if (e.type === 'DROP_SHADOW') {
			shadows.push(
				`${roundCssNumber(o.x)}px ${roundCssNumber(o.y)}px ${roundCssNumber(e.radius ?? 0)}px ${roundCssNumber(e.spread ?? 0)}px ${color}`,
			)
		} else if (e.type === 'INNER_SHADOW') {
			shadows.push(
				`inset ${roundCssNumber(o.x)}px ${roundCssNumber(o.y)}px ${roundCssNumber(e.radius ?? 0)}px ${roundCssNumber(e.spread ?? 0)}px ${color}`,
			)
		} else if (e.type === 'LAYER_BLUR') {
			filter = `blur(${roundCssNumber(e.radius ?? 0)}px)`
		} else if (e.type === 'BACKGROUND_BLUR') {
			backdrop = `blur(${roundCssNumber(e.radius ?? 0)}px)`
		}
	}
	return {
		'box-shadow': shadows.length ? shadows.join(',') : undefined,
		filter,
		'backdrop-filter': backdrop,
	}
}

// Figma blend mode → CSS mix-blend-mode. NORMAL/PASS_THROUGH는 생략.
const BLEND: Record<string, string> = {
	MULTIPLY: 'multiply',
	SCREEN: 'screen',
	OVERLAY: 'overlay',
	DARKEN: 'darken',
	LIGHTEN: 'lighten',
	COLOR_DODGE: 'color-dodge',
	COLOR_BURN: 'color-burn',
	HARD_LIGHT: 'hard-light',
	SOFT_LIGHT: 'soft-light',
	DIFFERENCE: 'difference',
	EXCLUSION: 'exclusion',
	HUE: 'hue',
	SATURATION: 'saturation',
	COLOR: 'color',
	LUMINOSITY: 'luminosity',
}

function resolveBorderRadius(node: Node): string | undefined {
	const r = node.rectangleCornerRadii
	if (r && r.length === 4)
		return `${roundCssNumber(r[0])}px ${roundCssNumber(r[1])}px ${roundCssNumber(r[2])}px ${roundCssNumber(r[3])}px`
	if (node.cornerRadius) return `${roundCssNumber(node.cornerRadius)}px`
	return undefined
}

// 노드 종류 무관 공통 박스 속성(배경 제외 — 배경은 컨테이너/텍스트 다르게).
function createBoxStyle(node: Node): Record<string, string | undefined> {
	return {
		opacity:
			node.opacity != null && node.opacity < 1
				? String(roundCssNumber(node.opacity))
				: undefined,
		// Figma와 CSS의 양수 회전 방향이 반대이므로 degree 값의 부호만 반전한다.
		transform: node.rotation ? `rotate(${roundCssNumber(-node.rotation)}deg)` : undefined,
		'border-radius': resolveBorderRadius(node),
		overflow: node.clipsContent ? 'hidden' : undefined,
		'mix-blend-mode': node.blendMode ? BLEND[node.blendMode] : undefined,
		...createBorderStyle(node),
		...createEffectStyle(node.effects),
	}
}

// 컨테이너 레이아웃 변환

const AXIS_ALIGN: Record<string, string> = {
	MIN: 'flex-start',
	CENTER: 'center',
	MAX: 'flex-end',
	SPACE_BETWEEN: 'space-between',
	BASELINE: 'baseline',
}

// MIN/CENTER/MAX/STRETCH/AUTO만 CSS로 옮기고, INHERIT 등은 키가 없어 자연히 생략된다.
const SELF_ALIGN: Record<string, string | undefined> = {
	MIN: 'start',
	CENTER: 'center',
	MAX: 'end',
	STRETCH: 'stretch',
	AUTO: 'start',
}

function createContainerStyle(node: Node): Record<string, string | undefined> {
	const pad = `${node.paddingTop ?? 0}px ${node.paddingRight ?? 0}px ${node.paddingBottom ?? 0}px ${node.paddingLeft ?? 0}px`

	if (node.layoutMode === 'GRID') {
		return {
			display: 'grid',
			'grid-template-columns': node.gridColumnsSizing?.trim(),
			'grid-template-rows': node.gridRowsSizing?.trim(),
			'column-gap': `${node.gridColumnGap ?? 0}px`,
			'row-gap': `${node.gridRowGap ?? 0}px`,
			'grid-auto-flow': node.gridItemsPositioning === 'COLUMN_AUTO_FLOW' ? 'column' : 'row',
			padding: pad,
		}
	}
	if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
		const horizontal = node.layoutMode === 'HORIZONTAL'
		return {
			display: 'flex',
			'flex-direction': horizontal ? 'row' : 'column',
			'flex-wrap': node.layoutWrap === 'WRAP' ? 'wrap' : undefined,
			'column-gap': `${horizontal ? (node.itemSpacing ?? 0) : (node.counterAxisSpacing ?? 0)}px`,
			'row-gap': `${horizontal ? (node.counterAxisSpacing ?? 0) : (node.itemSpacing ?? 0)}px`,
			'justify-content': AXIS_ALIGN[node.primaryAxisAlignItems ?? ''],
			'align-items': AXIS_ALIGN[node.counterAxisAlignItems ?? ''],
			'align-content':
				node.layoutWrap === 'WRAP' && node.counterAxisAlignContent === 'SPACE_BETWEEN'
					? 'space-between'
					: undefined,
			padding: pad,
		}
	}
	return {} // layoutMode 없음 → 자식이 절대배치
}

function createTextStyle(node: Node): Record<string, string | undefined> {
	const s = node.style ?? {}
	const italic = s.italic || /italic/i.test(s.fontStyle ?? '')

	// line-height: PIXELS=px, INTRINSIC_%(자동)=normal, FONT_SIZE_%=상대%.
	let lineHeight: string | undefined
	if (s.lineHeightUnit === 'PIXELS' && s.lineHeightPx)
		lineHeight = `${roundCssNumber(s.lineHeightPx)}px`
	else if (s.lineHeightUnit === 'FONT_SIZE_%' && s.lineHeightPercentFontSize)
		lineHeight = `${roundCssNumber(s.lineHeightPercentFontSize)}%`
	else if (s.lineHeightUnit === 'INTRINSIC_%') lineHeight = 'normal'
	else if (s.lineHeightPx) lineHeight = `${roundCssNumber(s.lineHeightPx)}px`

	const textCase: Record<string, string> = {
		UPPER: 'uppercase',
		LOWER: 'lowercase',
		TITLE: 'capitalize',
	}
	const textDeco: Record<string, string> = {
		UNDERLINE: 'underline',
		STRIKETHROUGH: 'line-through',
	}

	return {
		margin: '0',
		// ponytail: 텍스트 색은 SOLID fill만. gradient/image 텍스트 fill은 색 없이 상속(background-clip:text 미구현).
		color: findSolidColor(node.fills),
		'font-family': s.fontFamily ? `"${s.fontFamily}"` : undefined,
		'font-size': s.fontSize ? `${roundCssNumber(s.fontSize)}px` : undefined,
		'font-weight': s.fontWeight ? String(s.fontWeight) : undefined,
		'font-style': italic ? 'italic' : undefined,
		'line-height': lineHeight,
		'text-align': s.textAlignHorizontal?.toLowerCase(),
		'letter-spacing': s.letterSpacing ? `${roundCssNumber(s.letterSpacing)}px` : undefined,
		'text-transform': s.textCase ? textCase[s.textCase] : undefined,
		'text-decoration': s.textDecoration ? textDeco[s.textDecoration] : undefined,
		// HUG(WIDTH_AND_HEIGHT)=자동 줄바꿈 없이 명시 줄바꿈만(pre), 그 외=자동 줄바꿈 허용(pre-wrap). 둘 다 공백/개행 보존.
		'white-space': s.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap',
	}
}

// 자식 배치 전략

// 그리드 셀 라인: 앵커(0-based)가 있으면 명시 배치, 없고 span>1이면 span만, 그 외 생략.
function formatGridLine(anchor: number | undefined, span: number): string | undefined {
	if (anchor != null) return `${anchor + 1} / span ${span}`
	if (span > 1) return `span ${span}`
	return undefined
}

// 셀 내부 정렬: 명시값 우선. AUTO(기본)는 자식 리사이즈를 따른다 — FILL=stretch, 그 외(HUG/FIXED)=start.
function resolveGridSelfAlign(
	align: string | undefined,
	sizing: string | undefined,
): string | undefined {
	if (align && align !== 'AUTO') return SELF_ALIGN[align]
	return sizing === 'FILL' ? 'stretch' : 'start'
}

// FIXED 축은 명시 치수를 준다(HUG는 auto, FILL은 grow/stretch가 처리). flex·grid 자식 공통.
function createFixedSizeStyle(node: Node): Record<string, string | undefined> {
	const b = node.absoluteBoundingBox
	if (!b) return {}
	return {
		width: node.layoutSizingHorizontal === 'FIXED' ? `${roundCssNumber(b.width)}px` : undefined,
		height: node.layoutSizingVertical === 'FIXED' ? `${roundCssNumber(b.height)}px` : undefined,
	}
}

type CssStyle = Record<string, string | undefined>

interface ChildPlacementContext {
	node: Node
	parent: Node
	useAbsoluteBounds: boolean
}

/**
 * Strategy 패턴으로 부모 레이아웃별 자식 배치 규칙을 분리한다.
 * Grid, Auto Layout, Constraints의 선택 분기와 스타일 계산이 한 함수에 섞여
 * 규칙을 추가하거나 수정할 때 다른 배치 방식까지 건드려야 하는 문제를 해결한다.
 */
interface ChildPlacementStrategy {
	createStyle(context: ChildPlacementContext): CssStyle
}

class GridPlacementStrategy implements ChildPlacementStrategy {
	createStyle({ node }: ChildPlacementContext): CssStyle {
		return {
			'grid-column': formatGridLine(node.gridColumnAnchorIndex, node.gridColumnSpan ?? 1),
			'grid-row': formatGridLine(node.gridRowAnchorIndex, node.gridRowSpan ?? 1),
			'justify-self': resolveGridSelfAlign(
				node.gridChildHorizontalAlign,
				node.layoutSizingHorizontal,
			),
			'align-self': resolveGridSelfAlign(
				node.gridChildVerticalAlign,
				node.layoutSizingVertical,
			),
			...createFixedSizeStyle(node),
		}
	}
}

class AutoLayoutPlacementStrategy implements ChildPlacementStrategy {
	createStyle({ node }: ChildPlacementContext): CssStyle {
		return {
			'flex-grow': node.layoutGrow ? String(node.layoutGrow) : undefined,
			'align-self': node.layoutAlign ? SELF_ALIGN[node.layoutAlign] : undefined,
			...createFixedSizeStyle(node),
		}
	}
}

type AxisConstraint =
	| NonNullable<Node['constraints']>['horizontal']
	| NonNullable<Node['constraints']>['vertical']

interface ConstraintAxis {
	constraint?: AxisConstraint
	start: number
	size: number
	parentSize: number
	startProperty: 'left' | 'top'
	endProperty: 'right' | 'bottom'
	sizeProperty: 'width' | 'height'
}

const formatPx = (value: number) => `${roundCssNumber(value)}px`

function formatCenteredPosition(start: number, parentSize: number): string {
	const offset = roundCssNumber(start - parentSize / 2)
	if (offset === 0) return '50%'
	return `calc(50% ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)`
}

function createConstraintAxisStyle({
	constraint,
	start,
	size,
	parentSize,
	startProperty,
	endProperty,
	sizeProperty,
}: ConstraintAxis): Record<string, string> {
	const end = parentSize - start - size

	switch (constraint) {
		case 'RIGHT':
		case 'BOTTOM':
			return { [endProperty]: formatPx(end), [sizeProperty]: formatPx(size) }
		case 'CENTER':
			return {
				[startProperty]: formatCenteredPosition(start, parentSize),
				[sizeProperty]: formatPx(size),
			}
		case 'LEFT_RIGHT':
		case 'TOP_BOTTOM':
			return { [startProperty]: formatPx(start), [endProperty]: formatPx(end) }
		case 'SCALE':
			if (parentSize > 0) {
				return {
					[startProperty]: `${roundCssNumber((start / parentSize) * 100)}%`,
					[sizeProperty]: `${roundCssNumber((size / parentSize) * 100)}%`,
				}
			}
	}

	return { [startProperty]: formatPx(start), [sizeProperty]: formatPx(size) }
}

class ConstraintPlacementStrategy implements ChildPlacementStrategy {
	// 비 Grid/Auto Layout 자식의 Figma Constraints를 부모 기준 CSS 배치로 옮긴다.
	createStyle({ node, parent, useAbsoluteBounds }: ChildPlacementContext): CssStyle {
		const pb = parent.absoluteBoundingBox
		const b = node.absoluteBoundingBox
		if (!pb || !b) return {}

		// Figma가 렌더한 SVG는 회전까지 포함한 결과이므로 AABB 크기를 그대로 쓴다.
		const dim = useAbsoluteBounds ? b : (node.size ?? b)
		return {
			position: 'absolute',
			...createConstraintAxisStyle({
				constraint: node.constraints?.horizontal,
				start: b.x - pb.x,
				size: dim.width,
				parentSize: pb.width,
				startProperty: 'left',
				endProperty: 'right',
				sizeProperty: 'width',
			}),
			...createConstraintAxisStyle({
				constraint: node.constraints?.vertical,
				start: b.y - pb.y,
				size: dim.height,
				parentSize: pb.height,
				startProperty: 'top',
				endProperty: 'bottom',
				sizeProperty: 'height',
			}),
		}
	}
}

const gridPlacementStrategy = new GridPlacementStrategy()
const autoLayoutPlacementStrategy = new AutoLayoutPlacementStrategy()
const constraintPlacementStrategy = new ConstraintPlacementStrategy()

function resolveChildPlacementStrategy(parent: Node): ChildPlacementStrategy {
	if (parent.layoutMode === 'GRID') return gridPlacementStrategy
	if (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL') {
		return autoLayoutPlacementStrategy
	}
	return constraintPlacementStrategy
}

// 부모 레이아웃 종류에 따른 자식 배치.
function createChildPlacementStyle(
	node: Node,
	parent: Node | null,
	useAbsoluteBounds = false,
): Record<string, string | undefined> {
	if (!parent) return {}
	if (node.layoutPositioning === 'ABSOLUTE') {
		return constraintPlacementStrategy.createStyle({ node, parent, useAbsoluteBounds })
	}
	// ponytail: 회전 노드는 좌표를 AABB 코너로 잡아 근사한다(정확히는 relativeTransform 분해 필요). 비회전은 정확.
	return resolveChildPlacementStrategy(parent).createStyle({
		node,
		parent,
		useAbsoluteBounds,
	})
}

// HTML 직렬화

const escapeHtmlText = (t: string) =>
	t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeHtmlAttribute = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

function serializeNodeHtml(
	node: Node,
	parent: Node | null,
	isRoot: boolean,
	depth: number,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>>,
): string {
	if (node.visible === false) return ''

	const isText = node.type === 'TEXT'
	const renderedAsset = renderedAssets[node.id]
	const renderedBounds =
		renderedAsset && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}

	const style: Record<string, string | undefined> = {
		'box-sizing': 'border-box',
		...(isRoot && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}),
		...(renderedAsset ? { display: 'block', ...renderedBounds } : createContainerStyle(node)),
		...(renderedAsset ? {} : createBoxStyle(node)),
		// 컨테이너는 position:relative를 기본으로 둬 절대배치 자식의 기준 박스가 된다.
		// createChildPlacementStyle이 뒤에 병합되므로, 이 노드 자신이 절대배치면 position:absolute가 이겨 덮어쓴다.
		...(renderedAsset
			? {}
			: isText
				? createTextStyle(node)
				: { position: 'relative', background: resolveBackgroundValue(node) }),
		...createChildPlacementStyle(node, parent, Boolean(renderedAsset)),
	}

	const tag = renderedAsset ? 'img' : isText ? 'p' : 'div'

	// 개발자 확인용 pretty-print: 속성 한 줄씩, style은 선언 한 줄씩 펼친다.
	// HTML 속성값은 개행/탭을 담을 수 있고 CSS는 선언 사이 공백을 무시하므로 렌더에 영향 없다.
	// 모든 속성/선언 값은 escapeHtmlAttribute로 감싼다 — style의 " (font-family:"Inter")나 id/name의 " 가 속성을 끊고 핸들러를 주입하는 걸 막는다.
	// ponytail: escapeHtmlAttribute는 속성 탈출만 막고 CSS 값 내부(Figma 원본 문자열)의 ';' 주입은 못 막는다 → 렌더 경계 DOMPurify가 후속 과제.
	const pad = '\t'.repeat(depth)
	const attrPad = `${pad}\t`
	const declPad = `${pad}\t\t`

	const attrLines = [
		`data-node-id="${escapeHtmlAttribute(node.id)}"`,
		`data-figma-type="${escapeHtmlAttribute(node.type)}"`,
		`data-name="${escapeHtmlAttribute(node.name ?? '')}"`,
		...(renderedAsset
			? [
					`data-asset-collection="${renderedAsset.collection}"`,
					`data-asset-id="${renderedAsset.id}"`,
					`src="${escapeHtmlAttribute(renderedAsset.url)}"`,
					'alt=""',
				]
			: []),
	]
		.map((a) => `${attrPad}${a}`)
		.join('\n')

	const declLines = Object.entries(style)
		.filter(([, v]) => v != null && v !== '')
		.map(([k, v]) => `${declPad}${escapeHtmlAttribute(`${k}:${v}`)};`)
		.join('\n')

	const open = `${pad}<${tag}\n${attrLines}\n${attrPad}style="\n${declLines}\n${attrPad}"\n${pad}>`
	if (renderedAsset) return open

	// 텍스트는 내용을 여는 태그와 같은 줄에 둔다(공백/개행 보존이 white-space에 걸리므로 재들여쓰기 금지).
	if (isText) return `${open}${escapeHtmlText(node.characters ?? '')}</${tag}>`

	// 요소 사이 공백은 grid/flex 아이템이 되지 않고 block에선 collapse되어 렌더에 영향 없다.
	const children = (node.children ?? [])
		.map((c) => serializeNodeHtml(c, node, false, depth + 1, renderedAssets))
		.filter(Boolean)
	if (!children.length) return `${open}</${tag}>`
	return `${open}\n${children.join('\n')}\n${pad}</${tag}>`
}

// 공개 변환 진입점

export function convertFigmaNodeToHtml(
	node: Node,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>> = {},
): FigmaHtmlResult {
	return {
		html: serializeNodeHtml(node, null, true, 0, renderedAssets),
		width: roundCssNumber(node.absoluteBoundingBox?.width ?? 0),
		height: roundCssNumber(node.absoluteBoundingBox?.height ?? 0),
	}
}
