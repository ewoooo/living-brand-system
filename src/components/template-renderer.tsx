import NextImage from 'next/image'
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
	'borderRadius' | 'boxShadow' | 'color' | 'filter' | 'objectFit' | 'slotLabel'
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
	// 코드 실행(iframe 샌드박스) 직렬화 전용: 안쪽 stage div와 각 요소에 DOM id를 부여해
	// 템플릿 js가 getElementById로 통제할 수 있게 한다. 기본 off라 다른 소비자엔 영향 없다.
	emitDomIds = false,
}: {
	template: JsonTemplate
	values?: Record<string, TemplateSlotValue>
	scale?: number
	emitDomIds?: boolean
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
				id={emitDomIds ? '__stage' : undefined}
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
					<ElementView
						key={element.id}
						element={element}
						frame={absoluteFrameCss(element)}
						values={values}
						emitDomIds={emitDomIds}
					/>
				))}
			</div>
		</div>
	)
}

/** 최상위 요소의 절대좌표 프레임. 스택 자식은 flowFrameCss가 담당한다. */
function absoluteFrameCss(element: JsonTemplateElement): CSSProperties {
	return {
		position: 'absolute',
		left: element.x,
		top: element.y,
		// auto-width는 상자 폭이 텍스트를 따라간다 (x/y 앵커는 유지).
		width:
			element.type === 'text' && element.textFit === 'auto-width'
				? 'max-content'
				: element.width,
		height: element.height,
		zIndex: element.zIndex,
	}
}

/** 배치(frame)와 내용을 분리한 단일 뷰 — 절대좌표/flow 두 경로가 공유한다. */
function ElementView({
	element,
	frame,
	values,
	emitDomIds = false,
}: {
	element: JsonTemplateElement | JsonFlowElement
	frame: CSSProperties
	values?: Record<string, TemplateSlotValue>
	emitDomIds?: boolean
}) {
	const domId = emitDomIds ? element.id : undefined

	if (element.type === 'stack') {
		return (
			<div id={domId} style={{ ...frame, ...stackFlexCss(element) }}>
				{element.children.map((child) => (
					<ElementView
						key={child.id}
						element={child}
						frame={flowFrameCss(child, element.direction)}
						values={values}
						emitDomIds={emitDomIds}
					/>
				))}
			</div>
		)
	}

	const value = element.locked ? undefined : values?.[element.id]

	if (element.type === 'text') {
		return (
			<div id={domId} style={{ ...frame, ...textBoxCss(element) }}>
				<TextContent element={element} value={value} />
			</div>
		)
	}

	if (element.type === 'image') {
		return <ImageView element={element} src={value?.src ?? element.src} style={frame} id={domId} />
	}

	return <div id={domId} style={{ ...frame, ...rectCss(element) }} />
}

function TextContent({ element, value }: { element: TextLike; value?: TemplateSlotValue }) {
	// truncate는 상자 높이에 들어가는 줄 수를 계산해 말줄임한다. maxLines가 있으면 더 강한 제한이 이긴다.
	// 수동 편집된 fontSize/lineHeight 0은 Infinity를 만들므로 유한값일 때만 적용한다.
	const lineHeightPx = element.fontSize * element.lineHeight
	const truncateLines =
		element.textFit === 'truncate' && Number.isFinite(element.height / lineHeightPx)
			? Math.max(1, Math.floor(element.height / lineHeightPx))
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
		// 스키마 값이 그대로 유효한 CSS Box Alignment 키워드다. direction은 row/column뿐이라
		// (reverse 없음) 'start'/'end'는 'flex-start'/'flex-end'와 렌더가 같다.
		justifyContent: stack.justify,
		alignItems: stack.align,
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
		justifyContent: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[
			element.verticalAlign
		],
		fontSize: element.fontSize,
		fontFamily: `${element.fontFamily}, Pretendard, sans-serif`,
		fontWeight: element.fontWeight,
		color: element.color,
		lineHeight: element.lineHeight,
		letterSpacing: element.letterSpacing,
		textAlign: element.textAlign,
		// auto-width는 자동 줄바꿈은 없지만(pre) 수동 개행(\n)은 살린다. 나머지는 자동 줄바꿈+개행 유지(pre-wrap).
		whiteSpace: element.textFit === 'auto-width' ? 'pre' : 'pre-wrap',
		filter: element.filter,
	}
}

function imageCss(element: ImageLike): CSSProperties {
	return {
		objectFit: element.objectFit,
	}
}

function imageFrameCss(style: CSSProperties, element: ImageLike): CSSProperties {
	return {
		...style,
		position: style.position ?? 'relative',
		overflow: 'hidden',
		borderRadius: element.borderRadius,
		boxShadow: element.boxShadow,
		filter: element.filter,
	}
}

function maskCss(
	style: CSSProperties,
	element: ImageLike,
	src: string,
	maskSize: CSSProperties['maskSize'],
): CSSProperties {
	return {
		...style,
		borderRadius: element.borderRadius,
		boxShadow: element.boxShadow,
		backgroundColor: element.color,
		filter: element.filter,
		WebkitMaskImage: `url("${src}")`,
		maskImage: `url("${src}")`,
		WebkitMaskPosition: 'center',
		maskPosition: 'center',
		WebkitMaskRepeat: 'no-repeat',
		maskRepeat: 'no-repeat',
		WebkitMaskSize: maskSize,
		maskSize,
	}
}

function ImageView({
	element,
	src,
	style,
	id,
}: {
	element: ImageLike
	src: string
	style: CSSProperties
	id?: string
}) {
	if (element.color) {
		const maskSize = element.objectFit === 'fill' ? '100% 100%' : element.objectFit

		return <div id={id} style={maskCss(style, element, src, maskSize)} />
	}

	return (
		<div id={id} style={imageFrameCss(style, element)}>
			<NextImage
				alt={element.slotLabel ?? ''}
				fill
				sizes="100vw"
				src={src}
				style={imageCss(element)}
				unoptimized
			/>
		</div>
	)
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
