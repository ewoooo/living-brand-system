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
 * div=프레임/그룹/셰이프, p=텍스트. Figma 노드 타입은 data-figma-type으로 보존한다(레이어 패널용).
 * 아직 못 담는 것: 이미지 픽셀(승인 에셋 배선은 별도), vector path 형상.
 */

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
	layoutWrap?: string
	gridColumnGap?: number
	gridRowGap?: number
	gridColumnsSizing?: string
	gridRowsSizing?: string
	gridItemsPositioning?: string
	// 자식 배치
	layoutGrow?: number
	layoutAlign?: string
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

const round = (n: number) => Math.round(n * 100) / 100

function rgba(
	color?: { r: number; g: number; b: number; a?: number },
	opacity = 1,
): string | undefined {
	if (!color) return undefined
	const c = (v: number) => Math.round(v * 255)
	const a = round((color.a ?? 1) * opacity)
	return a >= 1
		? `rgb(${c(color.r)},${c(color.g)},${c(color.b)})`
		: `rgba(${c(color.r)},${c(color.g)},${c(color.b)},${a})`
}

const isVisible = (p: { visible?: boolean }) => p.visible !== false

// SOLID 페인트 → 색. gradient/image는 background()가 따로 처리.
function solidColor(paints?: FigmaPaint[]): string | undefined {
	const p = paints?.find((x) => x.type === 'SOLID' && isVisible(x))
	return p ? rgba(p.color, p.opacity ?? 1) : undefined
}

// linear/radial gradient → CSS. 색 정지점은 정확하고, paint 불투명도를 정지점 알파에 곱한다.
// ponytail: linear 각도는 핸들 벡터 근사. radial/diamond는 CSS 기본(중앙 ellipse)으로 근사 — 중심/반경/모양 핸들은 무시. 편차 나면 여기 보정.
function gradientCss(paint: FigmaGradientPaint): string | undefined {
	const stops = paint.gradientStops
	if (!stops?.length) return undefined
	const op = paint.opacity ?? 1
	const stopStr = stops
		.map((s) => `${rgba(s.color, op)} ${round((s.position ?? 0) * 100)}%`)
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

// 컨테이너 배경: fills(모던) → background(레거시) → backgroundColor 순. gradient도 지원.
// ponytail: 첫 번째 보이는 paint만 쓴다(스택된 fill 미합성). IMAGE fill은 픽셀이라 배경 없이 남긴다(에셋 배선은 별도 슬라이스).
function backgroundValue(node: Node): string | undefined {
	const paints = node.fills?.length ? node.fills : node.background
	const paint = paints?.find(isVisible)
	if (paint) {
		if (paint.type === 'SOLID') return rgba(paint.color, paint.opacity ?? 1)
		if (paint.type.startsWith('GRADIENT')) return gradientCss(paint)
	}
	return rgba(node.backgroundColor)
}

// strokes → border. 개별 두께가 있으면 변별 두께로.
// ponytail: strokeAlign(INSIDE/OUTSIDE/CENTER)은 무시하고 border-box border(=INSIDE)로 근사. OUTSIDE/CENTER는 CSS border로 충실 표현 불가.
function borderDecls(node: Node): Record<string, string | undefined> {
	const color = solidColor(node.strokes)
	if (!color) return {}
	const iw = node.individualStrokeWeights
	if (iw) {
		return {
			'border-style': 'solid',
			'border-color': color,
			'border-top-width': `${round(iw.top)}px`,
			'border-right-width': `${round(iw.right)}px`,
			'border-bottom-width': `${round(iw.bottom)}px`,
			'border-left-width': `${round(iw.left)}px`,
		}
	}
	return { border: `${round(node.strokeWeight ?? 1)}px solid ${color}` }
}

// effects → box-shadow(그림자) + filter(레이어 블러) + backdrop-filter(배경 블러).
function effectDecls(effects?: FigmaEffect[]): Record<string, string | undefined> {
	if (!effects?.length) return {}
	const shadows: string[] = []
	let filter: string | undefined
	let backdrop: string | undefined
	for (const e of effects) {
		if (e.visible === false) continue
		const o = e.offset ?? { x: 0, y: 0 }
		const color = rgba(e.color) ?? 'rgba(0,0,0,0.25)'
		if (e.type === 'DROP_SHADOW') {
			shadows.push(
				`${round(o.x)}px ${round(o.y)}px ${round(e.radius ?? 0)}px ${round(e.spread ?? 0)}px ${color}`,
			)
		} else if (e.type === 'INNER_SHADOW') {
			shadows.push(
				`inset ${round(o.x)}px ${round(o.y)}px ${round(e.radius ?? 0)}px ${round(e.spread ?? 0)}px ${color}`,
			)
		} else if (e.type === 'LAYER_BLUR') {
			filter = `blur(${round(e.radius ?? 0)}px)`
		} else if (e.type === 'BACKGROUND_BLUR') {
			backdrop = `blur(${round(e.radius ?? 0)}px)`
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

function borderRadius(node: Node): string | undefined {
	const r = node.rectangleCornerRadii
	if (r && r.length === 4)
		return `${round(r[0])}px ${round(r[1])}px ${round(r[2])}px ${round(r[3])}px`
	if (node.cornerRadius) return `${round(node.cornerRadius)}px`
	return undefined
}

// 노드 종류 무관 공통 박스 속성(배경 제외 — 배경은 컨테이너/텍스트 다르게).
function boxStyle(node: Node): Record<string, string | undefined> {
	return {
		opacity: node.opacity != null && node.opacity < 1 ? String(round(node.opacity)) : undefined,
		// ponytail: Figma rotation은 라디안·반시계 양수, CSS rotate는 시계 양수라 부호 반전. 회전 노드 없는 파일이라 미검증.
		transform: node.rotation
			? `rotate(${round((-node.rotation * 180) / Math.PI)}deg)`
			: undefined,
		'border-radius': borderRadius(node),
		overflow: node.clipsContent ? 'hidden' : undefined,
		'mix-blend-mode': node.blendMode ? BLEND[node.blendMode] : undefined,
		...borderDecls(node),
		...effectDecls(node.effects),
	}
}

const AXIS_ALIGN: Record<string, string> = {
	MIN: 'flex-start',
	CENTER: 'center',
	MAX: 'flex-end',
	SPACE_BETWEEN: 'space-between',
}

// MIN/CENTER/MAX/STRETCH/AUTO만 CSS로 옮기고, INHERIT 등은 키가 없어 자연히 생략된다.
const SELF_ALIGN: Record<string, string | undefined> = {
	MIN: 'start',
	CENTER: 'center',
	MAX: 'end',
	STRETCH: 'stretch',
	AUTO: 'start',
}

function containerStyle(node: Node): Record<string, string | undefined> {
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
		return {
			display: 'flex',
			'flex-direction': node.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
			'flex-wrap': node.layoutWrap === 'WRAP' ? 'wrap' : undefined,
			gap: `${node.itemSpacing ?? 0}px`,
			'justify-content': AXIS_ALIGN[node.primaryAxisAlignItems ?? ''],
			'align-items': AXIS_ALIGN[node.counterAxisAlignItems ?? ''],
			padding: pad,
		}
	}
	return {} // layoutMode 없음 → 자식이 절대배치
}

function textStyle(node: Node): Record<string, string | undefined> {
	const s = node.style ?? {}
	const italic = s.italic || /italic/i.test(s.fontStyle ?? '')

	// line-height: PIXELS=px, INTRINSIC_%(자동)=normal, FONT_SIZE_%=상대%.
	let lineHeight: string | undefined
	if (s.lineHeightUnit === 'PIXELS' && s.lineHeightPx) lineHeight = `${round(s.lineHeightPx)}px`
	else if (s.lineHeightUnit === 'FONT_SIZE_%' && s.lineHeightPercentFontSize)
		lineHeight = `${round(s.lineHeightPercentFontSize)}%`
	else if (s.lineHeightUnit === 'INTRINSIC_%') lineHeight = 'normal'
	else if (s.lineHeightPx) lineHeight = `${round(s.lineHeightPx)}px`

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
		color: solidColor(node.fills),
		'font-family': s.fontFamily ? `"${s.fontFamily}"` : undefined,
		'font-size': s.fontSize ? `${round(s.fontSize)}px` : undefined,
		'font-weight': s.fontWeight ? String(s.fontWeight) : undefined,
		'font-style': italic ? 'italic' : undefined,
		'line-height': lineHeight,
		'text-align': s.textAlignHorizontal?.toLowerCase(),
		'letter-spacing': s.letterSpacing ? `${round(s.letterSpacing)}px` : undefined,
		'text-transform': s.textCase ? textCase[s.textCase] : undefined,
		'text-decoration': s.textDecoration ? textDeco[s.textDecoration] : undefined,
		// HUG(WIDTH_AND_HEIGHT)=자동 줄바꿈 없이 명시 줄바꿈만(pre), 그 외=자동 줄바꿈 허용(pre-wrap). 둘 다 공백/개행 보존.
		'white-space': s.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap',
	}
}

// 그리드 셀 라인: 앵커(0-based)가 있으면 명시 배치, 없고 span>1이면 span만, 그 외 생략.
function gridLine(anchor: number | undefined, span: number): string | undefined {
	if (anchor != null) return `${anchor + 1} / span ${span}`
	if (span > 1) return `span ${span}`
	return undefined
}

// 셀 내부 정렬: 명시값 우선. AUTO(기본)는 자식 리사이즈를 따른다 — FILL=stretch, 그 외(HUG/FIXED)=start.
function gridSelfAlign(align: string | undefined, sizing: string | undefined): string | undefined {
	if (align && align !== 'AUTO') return SELF_ALIGN[align]
	return sizing === 'FILL' ? 'stretch' : 'start'
}

// FIXED 축은 명시 치수를 준다(HUG는 auto, FILL은 grow/stretch가 처리). flex·grid 자식 공통.
function fixedSize(node: Node): Record<string, string | undefined> {
	const b = node.absoluteBoundingBox
	if (!b) return {}
	return {
		width: node.layoutSizingHorizontal === 'FIXED' ? `${round(b.width)}px` : undefined,
		height: node.layoutSizingVertical === 'FIXED' ? `${round(b.height)}px` : undefined,
	}
}

// 부모 레이아웃 종류에 따른 자식 배치.
function childPlacement(node: Node, parent: Node | null): Record<string, string | undefined> {
	if (!parent) return {}

	if (parent.layoutMode === 'GRID') {
		// 셀 앵커+span으로 명시 배치, 셀 내부 정렬, FIXED 자식은 명시 치수(안 주면 0폭으로 붕괴).
		return {
			'grid-column': gridLine(node.gridColumnAnchorIndex, node.gridColumnSpan ?? 1),
			'grid-row': gridLine(node.gridRowAnchorIndex, node.gridRowSpan ?? 1),
			'justify-self': gridSelfAlign(
				node.gridChildHorizontalAlign,
				node.layoutSizingHorizontal,
			),
			'align-self': gridSelfAlign(node.gridChildVerticalAlign, node.layoutSizingVertical),
			...fixedSize(node),
		}
	}
	if (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL') {
		return {
			'flex-grow': node.layoutGrow ? String(node.layoutGrow) : undefined,
			'align-self': node.layoutAlign ? SELF_ALIGN[node.layoutAlign] : undefined,
			...fixedSize(node),
		}
	}
	// 부모 레이아웃 없음 → 절대배치(부모 박스 기준 상대좌표). 치수는 회전 전 실크기(size) 우선.
	// ponytail: 회전 노드는 좌표를 AABB 코너로 잡아 근사한다(정확히는 relativeTransform 분해 필요). 비회전은 정확.
	const pb = parent.absoluteBoundingBox
	const b = node.absoluteBoundingBox
	if (pb && b) {
		const dim = node.size ?? b
		return {
			position: 'absolute',
			left: `${round(b.x - pb.x)}px`,
			top: `${round(b.y - pb.y)}px`,
			width: `${round(dim.width)}px`,
			height: `${round(dim.height)}px`,
		}
	}
	return {}
}

function decls(map: Record<string, string | undefined>): string {
	return Object.entries(map)
		.filter(([, v]) => v != null && v !== '')
		.map(([k, v]) => `${k}:${v}`)
		.join(';')
}

const escapeHtml = (t: string) =>
	t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttr = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

function renderNode(node: Node, parent: Node | null, isRoot: boolean): string {
	if (node.visible === false) return ''

	const isText = node.type === 'TEXT'

	const style: Record<string, string | undefined> = {
		'box-sizing': 'border-box',
		...(isRoot && node.absoluteBoundingBox
			? {
					width: `${round(node.absoluteBoundingBox.width)}px`,
					height: `${round(node.absoluteBoundingBox.height)}px`,
				}
			: {}),
		...containerStyle(node),
		...boxStyle(node),
		// 컨테이너는 position:relative를 기본으로 둬 절대배치 자식의 기준 박스가 된다.
		// childPlacement가 뒤에 병합되므로, 이 노드 자신이 절대배치면 position:absolute가 이겨 덮어쓴다.
		...(isText ? textStyle(node) : { position: 'relative', background: backgroundValue(node) }),
		...childPlacement(node, parent),
	}

	const content = isText
		? escapeHtml(node.characters ?? '')
		: (node.children ?? []).map((c) => renderNode(c, node, false)).join('')

	const tag = isText ? 'p' : 'div'
	// 모든 속성값은 escapeAttr로 감싼다 — style의 큰따옴표(font-family:"Inter")나 id/name의 " 가 속성을 끊고 핸들러를 주입하는 걸 막는다.
	// ponytail: escapeAttr는 속성 탈출만 막고 CSS 값 내부(font-family/grid-*Sizing 등 Figma 원본 문자열)의 ';' 주입은 못 막는다.
	// 이 HTML은 다운스트림에서 dangerouslySetInnerHTML로 렌더되며 sanitizer가 없다 → 렌더 경계에 DOMPurify 도입이 후속 과제(신뢰경계는 Figma 파일).
	return `<${tag} data-node-id="${escapeAttr(node.id)}" data-figma-type="${escapeAttr(node.type)}" data-name="${escapeAttr(node.name ?? '')}" style="${escapeAttr(decls(style))}">${content}</${tag}>`
}

export function figmaNodeToHtml(node: Node): FigmaHtmlResult {
	return {
		html: renderNode(node, null, true),
		width: round(node.absoluteBoundingBox?.width ?? 0),
		height: round(node.absoluteBoundingBox?.height ?? 0),
	}
}
