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

	if (element.type === 'stack') {
		// 스택 flow 렌더는 아직 미구현 — 변환기가 stack을 내보내기 전까지 도달하지 않는 경로다.
		return null
	}

	if (element.type === 'text') {
		return (
			<div
				style={{
					...frame,
					// 세로 정렬 기준으로 쌓는다 — 상자보다 커지면 정렬 반대 방향으로 넘친다 (bottom이면 위로).
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
					// auto-width는 상자 폭이 텍스트를 따라간다 (x/y 앵커는 유지).
					...(element.textFit === 'auto-width' ? { width: 'max-content' } : {}),
					filter: element.filter,
				}}
			>
				<div
					style={
						element.maxLines
							? {
									display: '-webkit-box',
									WebkitBoxOrient: 'vertical',
									WebkitLineClamp: element.maxLines,
									overflow: 'hidden',
								}
							: undefined
					}
				>
					{value?.text ?? element.text}
				</div>
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
