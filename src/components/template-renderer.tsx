import type { CSSProperties } from 'react'
import type { JsonTemplate, JsonTemplateElement } from '@/types/json-template'

export interface TemplateSlotValue {
	text?: string
	src?: string
}

/**
 * jsonTemplate을 절대좌표 DOM으로 그리는 순수 렌더러.
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
					<TemplateElement
						key={element.id}
						element={element}
						value={element.locked ? undefined : values?.[element.id]}
					/>
				))}
			</div>
		</div>
	)
}

function TemplateElement({
	element,
	value,
}: {
	element: JsonTemplateElement
	value?: TemplateSlotValue
}) {
	const frame: CSSProperties = {
		position: 'absolute',
		left: element.x,
		top: element.y,
		width: element.width,
		height: element.height,
		zIndex: element.zIndex,
	}

	if (element.type === 'text') {
		return (
			<div
				style={{
					...frame,
					fontSize: element.fontSize,
					fontFamily: `${element.fontFamily}, Pretendard, sans-serif`,
					fontWeight: element.fontWeight,
					color: element.color,
					lineHeight: element.lineHeight,
					letterSpacing: element.letterSpacing,
					textAlign: element.textAlign,
					whiteSpace: 'pre-wrap',
					filter: element.filter,
				}}
			>
				{value?.text ?? element.text}
			</div>
		)
	}

	if (element.type === 'image') {
		return (
			// biome-ignore lint/performance/noImgElement: 템플릿 원본 픽셀 그대로 그려야 하므로 next/image 최적화를 쓰지 않는다.
			<img
				alt=""
				src={value?.src ?? element.src}
				style={{
					...frame,
					objectFit: element.objectFit,
					borderRadius: element.borderRadius,
					boxShadow: element.boxShadow,
					filter: element.filter,
				}}
			/>
		)
	}

	return (
		<div
			style={{
				...frame,
				background: element.fill,
				opacity: element.opacity,
				borderRadius: element.borderRadius,
				boxShadow: element.boxShadow,
				filter: element.filter,
			}}
		/>
	)
}
