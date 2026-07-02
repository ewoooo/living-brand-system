import type { CSSProperties } from 'react'
import type {
	JsonFlowElement,
	JsonStackElement,
	JsonTemplate,
	JsonTemplateElement,
} from '@/types/json-template'

export interface TemplateSlotValue {
	text?: string
	src?: string
}

// 절대좌표/flow 두 변형이 공유하는 스타일 필드만 추린 형태.
type TextLike = Pick<
	Extract<JsonFlowElement, { type: 'text' }>,
	| 'color'
	| 'filter'
	| 'fontFamily'
	| 'fontSize'
	| 'fontWeight'
	| 'height'
	| 'letterSpacing'
	| 'lineHeight'
	| 'maxLines'
	| 'text'
	| 'textAlign'
	| 'textFit'
	| 'verticalAlign'
>
type ImageLike = Pick<
	Extract<JsonFlowElement, { type: 'image' }>,
	'borderRadius' | 'boxShadow' | 'filter' | 'objectFit'
>
type RectLike = Pick<
	Extract<JsonFlowElement, { type: 'rect' }>,
	'borderRadius' | 'boxShadow' | 'fill' | 'filter' | 'opacity'
>
type StackLike = Pick<
	JsonStackElement,
	'align' | 'direction' | 'fill' | 'gap' | 'justify' | 'padding'
>

/**
 * jsonTemplate을 DOM으로 그리는 순수 렌더러.
 * 최상위 요소는 절대좌표로, stack의 children은 flex 흐름으로 배치한다.
 * (template, values)만으로 결과가 정해지며, 슬롯 입력은 locked=false 요소의 id로 덮어쓴다.
 * template-import 미리보기와 asset-generation 편집 화면이 공유한다.
 */
export function TemplateRenderer({
	template,
	values,
	scale = 1,
}: {
	template: JsonTemplate
	values?: Record<string, TemplateSlotValue>
	scale?: number
}) {
	return (
		<div
			style={{
				width: template.width * scale,
				height: template.height * scale,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'relative',
					width: template.width,
					height: template.height,
					background: template.background,
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
				}}
			>
				{template.elements.map((element) => (
					<TemplateElement key={element.id} element={element} values={values} />
				))}
			</div>
		</div>
	)
}

function TemplateElement({
	element,
	values,
}: {
	element: JsonTemplateElement
	values?: Record<string, TemplateSlotValue>
}) {
	const frame: CSSProperties = {
		position: 'absolute',
		left: element.x,
		top: element.y,
		width: element.width,
		height: element.height,
		zIndex: element.zIndex,
	}

	if (element.type === 'stack') {
		return (
			<div style={{ ...frame, ...stackFlexCss(element) }}>
				{element.children.map((child) => (
					<FlowElementView
						key={child.id}
						element={child}
						values={values}
						parentDirection={element.direction}
					/>
				))}
			</div>
		)
	}

	const value = element.locked ? undefined : values?.[element.id]

	if (element.type === 'text') {
		return (
			<div
				style={{
					...frame,
					...textBoxCss(element),
					// auto-width는 상자 폭이 텍스트를 따라간다 (x/y 앵커는 유지).
					...(element.textFit === 'auto-width' ? { width: 'max-content' } : {}),
				}}
			>
				<TextContent element={element} value={value} />
			</div>
		)
	}

	if (element.type === 'image') {
		return (
			// biome-ignore lint/performance/noImgElement: 템플릿 원본 픽셀 그대로 그려야 하므로 next/image 최적화를 쓰지 않는다.
			<img
				alt=""
				src={value?.src ?? element.src}
				style={{ ...frame, ...imageCss(element) }}
			/>
		)
	}

	return <div style={{ ...frame, ...rectCss(element) }} />
}

/** 스택 자식 — 좌표 없이 flex 흐름이 배치하고, 크기는 fixed/hug/fill 모드가 정한다. */
function FlowElementView({
	element,
	values,
	parentDirection,
}: {
	element: JsonFlowElement
	values?: Record<string, TemplateSlotValue>
	parentDirection: 'horizontal' | 'vertical'
}) {
	const flowFrame = flowFrameCss(element, parentDirection)

	if (element.type === 'stack') {
		return (
			<div style={{ ...flowFrame, ...stackFlexCss(element) }}>
				{element.children.map((child) => (
					<FlowElementView
						key={child.id}
						element={child}
						values={values}
						parentDirection={element.direction}
					/>
				))}
			</div>
		)
	}

	const value = element.locked ? undefined : values?.[element.id]

	if (element.type === 'text') {
		return (
			<div style={{ ...flowFrame, ...textBoxCss(element) }}>
				<TextContent element={element} value={value} />
			</div>
		)
	}

	if (element.type === 'image') {
		return (
			// biome-ignore lint/performance/noImgElement: 템플릿 원본 픽셀 그대로 그려야 하므로 next/image 최적화를 쓰지 않는다.
			<img
				alt=""
				src={value?.src ?? element.src}
				style={{ ...flowFrame, ...imageCss(element) }}
			/>
		)
	}

	return <div style={{ ...flowFrame, ...rectCss(element) }} />
}

function TextContent({ element, value }: { element: TextLike; value?: TemplateSlotValue }) {
	// truncate는 상자 높이에 들어가는 줄 수를 계산해 말줄임한다. maxLines가 있으면 더 강한 제한이 이긴다.
	const truncateLines =
		element.textFit === 'truncate'
			? Math.max(1, Math.floor(element.height / (element.fontSize * element.lineHeight)))
			: undefined
	const clampLines =
		element.maxLines && truncateLines
			? Math.min(element.maxLines, truncateLines)
			: (element.maxLines ?? truncateLines)

	return (
		<div
			style={
				clampLines
					? {
							display: '-webkit-box',
							WebkitBoxOrient: 'vertical',
							WebkitLineClamp: clampLines,
							overflow: 'hidden',
						}
					: undefined
			}
		>
			{value?.text ?? element.text}
		</div>
	)
}

function stackFlexCss(stack: StackLike): CSSProperties {
	return {
		display: 'flex',
		flexDirection: stack.direction === 'horizontal' ? 'row' : 'column',
		background: stack.fill,
		gap: stack.gap,
		padding: `${stack.padding.top}px ${stack.padding.right}px ${stack.padding.bottom}px ${stack.padding.left}px`,
		boxSizing: 'border-box',
		justifyContent:
			stack.justify === 'space-between'
				? 'space-between'
				: stack.justify === 'center'
					? 'center'
					: stack.justify === 'end'
						? 'flex-end'
						: 'flex-start',
		alignItems:
			stack.align === 'center' ? 'center' : stack.align === 'end' ? 'flex-end' : 'flex-start',
	}
}

/**
 * fixed/hug/fill 크기 모드를 flex 속성으로 옮긴다.
 * fill은 주축이면 flex-grow, 교차축이면 align-self: stretch — Figma의 FILL 의미와 같다.
 */
function flowFrameCss(
	element: JsonFlowElement,
	parentDirection: 'horizontal' | 'vertical',
): CSSProperties {
	const style: CSSProperties = { flexShrink: 0 }
	const widthIsMainAxis = parentDirection === 'horizontal'

	if (element.widthMode === 'fixed') {
		style.width = element.width
	} else if (element.widthMode === 'fill') {
		if (widthIsMainAxis) {
			style.flexGrow = 1
			style.flexBasis = 0
			style.flexShrink = 1
			style.minWidth = 0
		} else {
			style.alignSelf = 'stretch'
		}
	}

	if (element.heightMode === 'fixed') {
		style.height = element.height
	} else if (element.heightMode === 'fill') {
		if (widthIsMainAxis) {
			style.alignSelf = 'stretch'
		} else {
			style.flexGrow = 1
			style.flexBasis = 0
			style.flexShrink = 1
			style.minHeight = 0
		}
	}

	return style
}

// 세로 정렬 기준으로 쌓는다 — 상자보다 커지면 정렬 반대 방향으로 넘친다 (bottom이면 위로).
function textBoxCss(element: TextLike): CSSProperties {
	return {
		display: 'flex',
		flexDirection: 'column',
		justifyContent:
			element.verticalAlign === 'bottom'
				? 'flex-end'
				: element.verticalAlign === 'middle'
					? 'center'
					: 'flex-start',
		fontSize: element.fontSize,
		fontFamily: `${element.fontFamily}, Pretendard, sans-serif`,
		fontWeight: element.fontWeight,
		color: element.color,
		lineHeight: element.lineHeight,
		letterSpacing: element.letterSpacing,
		textAlign: element.textAlign,
		whiteSpace: element.textFit === 'auto-width' ? 'nowrap' : 'pre-wrap',
		filter: element.filter,
	}
}

function imageCss(element: ImageLike): CSSProperties {
	return {
		objectFit: element.objectFit,
		borderRadius: element.borderRadius,
		boxShadow: element.boxShadow,
		filter: element.filter,
	}
}

function rectCss(element: RectLike): CSSProperties {
	return {
		background: element.fill,
		opacity: element.opacity,
		borderRadius: element.borderRadius,
		boxShadow: element.boxShadow,
		filter: element.filter,
	}
}
