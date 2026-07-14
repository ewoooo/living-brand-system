import type {
	FigmaNode,
	FigmaPaint,
} from '@/features/template-import/repositories/figma.rest.repository'

/**
 * Figma REST 노드 트리 → inline-style HTML 문자열.
 * Figma가 이미 grid/auto-layout을 CSS에 대응되는 필드로 주므로(gridColumnsSizing 등) 재해석 없이 필드→CSS로 옮긴다.
 * 스코프: frame(grid/auto-layout/absolute) + text. 이펙트·이미지 픽셀은 무시(레이아웃과 수치만). 런타임 렌더용이라
 * Tailwind가 아니라 inline style로 굳혀 빌드 스캔에 의존하지 않는다.
 */

interface Node extends FigmaNode {
	background?: FigmaPaint[]
	gridColumnGap?: number
	gridRowGap?: number
	gridColumnsSizing?: string
	gridRowsSizing?: string
	gridItemsPositioning?: string
	gridColumnSpan?: number
	gridRowSpan?: number
	layoutGrow?: number
	children?: Node[]
}

export interface FigmaHtmlResult {
	html: string
	width: number
	height: number
}

const round = (n: number) => Math.round(n * 100) / 100

function cssColor(paint?: FigmaPaint): string | undefined {
	if (!paint || paint.visible === false || paint.type !== 'SOLID' || !paint.color)
		return undefined
	const { r, g, b, a = 1 } = paint.color
	const c = (v: number) => Math.round(v * 255)
	return a >= 1 ? `rgb(${c(r)},${c(g)},${c(b)})` : `rgba(${c(r)},${c(g)},${c(b)},${round(a)})`
}

const firstSolid = (paints?: FigmaPaint[]) =>
	paints?.find((p) => p.type === 'SOLID' && p.visible !== false)

function decls(map: Record<string, string | undefined>): string {
	return Object.entries(map)
		.filter(([, v]) => v != null && v !== '')
		.map(([k, v]) => `${k}:${v}`)
		.join(';')
}

const escapeHtml = (t: string) =>
	t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttr = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// Figma primary/counter axis 정렬 → flexbox 값.
const AXIS_ALIGN: Record<string, string> = {
	MIN: 'flex-start',
	CENTER: 'center',
	MAX: 'flex-end',
	SPACE_BETWEEN: 'space-between',
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
	return {
		margin: '0',
		color: cssColor(firstSolid(node.fills)),
		'font-family': s.fontFamily ? `"${s.fontFamily}"` : undefined,
		'font-size': s.fontSize ? `${s.fontSize}px` : undefined,
		'font-weight': s.fontWeight ? String(s.fontWeight) : undefined,
		'line-height': s.lineHeightPx ? `${round(s.lineHeightPx)}px` : undefined,
		'text-align': s.textAlignHorizontal?.toLowerCase(),
		'letter-spacing': s.letterSpacing ? `${s.letterSpacing}px` : undefined,
		'white-space': 'pre-wrap',
	}
}

// 부모 레이아웃 종류에 따른 자식 배치.
function childPlacement(node: Node, parent: Node | null): Record<string, string | undefined> {
	if (!parent) return {}

	if (parent.layoutMode === 'GRID') {
		// ROW/COLUMN auto-flow 기준으로 순서대로 채운다. span만 반영. (v1: 수동 셀 pin 미지원)
		return {
			'grid-column':
				(node.gridColumnSpan ?? 1) > 1 ? `span ${node.gridColumnSpan}` : undefined,
			'grid-row': (node.gridRowSpan ?? 1) > 1 ? `span ${node.gridRowSpan}` : undefined,
		}
	}
	if (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL') {
		return { 'flex-grow': node.layoutGrow ? String(node.layoutGrow) : undefined }
	}
	// 부모 레이아웃 없음 → 절대배치(부모 박스 기준 상대좌표).
	const pb = parent.absoluteBoundingBox
	const b = node.absoluteBoundingBox
	if (pb && b) {
		return {
			position: 'absolute',
			left: `${round(b.x - pb.x)}px`,
			top: `${round(b.y - pb.y)}px`,
			width: `${round(b.width)}px`,
			height: `${round(b.height)}px`,
		}
	}
	return {}
}

function renderNode(node: Node, parent: Node | null, isRoot: boolean): string {
	if (node.visible === false) return ''

	const isText = node.type === 'TEXT'
	const bg = isText ? undefined : cssColor(firstSolid(node.background) ?? firstSolid(node.fills))

	const style: Record<string, string | undefined> = {
		'box-sizing': 'border-box',
		...(isRoot && node.absoluteBoundingBox
			? {
					width: `${round(node.absoluteBoundingBox.width)}px`,
					height: `${round(node.absoluteBoundingBox.height)}px`,
				}
			: {}),
		...containerStyle(node),
		...(isText ? textStyle(node) : { background: bg }),
		...childPlacement(node, parent),
	}

	const content = isText
		? escapeHtml(node.characters ?? '')
		: (node.children ?? []).map((c) => renderNode(c, node, false)).join('')

	const tag = isText ? 'p' : 'div'
	return `<${tag} data-node-id="${node.id}" data-name="${escapeAttr(node.name ?? '')}" style="${decls(style)}">${content}</${tag}>`
}

export function figmaNodeToHtml(node: Node): FigmaHtmlResult {
	return {
		html: renderNode(node, null, true),
		width: round(node.absoluteBoundingBox?.width ?? 0),
		height: round(node.absoluteBoundingBox?.height ?? 0),
	}
}
