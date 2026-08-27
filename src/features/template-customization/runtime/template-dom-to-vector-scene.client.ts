'use client'

import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'

/**
 * 레이아웃이 끝난 export stage를 파일 형식과 무관한 Vector Scene으로 옮긴다.
 *
 * 🔑 stage는 `withTemplateRasterStage`가 만든 것을 그대로 받는다 — 태그가 `div`·`img`·`p` 3종으로
 *    제한되고 이미지·서체 로딩까지 끝난 상태다. 그래서 여기서는 **잰다**만 하고 안전성은 다시 보지 않는다.
 * 🔴 좌표는 브라우저 레이아웃에서만 나온다. Figma가 준 HTML은 좌표를 CSS에 갖고 있지만 텍스트 줄바꿈은
 *    렌더해 봐야 알 수 있어서, 노드 스타일을 읽는 방식으로는 줄 단위 위치를 못 만든다.
 *
 * 표현하지 못하는 시각 효과(그라디언트·그림자·블러·마스크)는 버리지 않고 `unsupported`에 담아
 * 돌려준다 — 그 노드만 래스터로 구워 얹는 폴백이 이 목록을 읽는다.
 */
export type TemplateVectorSceneResult = {
	scene: VectorScene
	/** 벡터로 옮기지 못한 노드. `{nodeId, reason}`이며 래스터 폴백의 입력이다. */
	unsupported: readonly { nodeId: string; reason: string }[]
}

type Box = { x: number; y: number; width: number; height: number }

export function templateDomToVectorScene(
	stage: HTMLElement,
	size: { width: number; height: number },
): TemplateVectorSceneResult {
	const origin = stage.getBoundingClientRect()
	const unsupported: { nodeId: string; reason: string }[] = []
	const context = { origin, unsupported }
	const primitives = Array.from(stage.children).flatMap((child) =>
		child instanceof HTMLElement ? walk(child, context) : [],
	)

	return {
		scene: {
			width: size.width,
			height: size.height,
			// 판 자체의 바닥색은 stage의 배경이 갖는다 — 없으면 흰색이 인쇄 기본이다.
			background: solidColor(getComputedStyle(stage).backgroundColor) ?? '#ffffff',
			primitives,
		},
		unsupported,
	}
}

type WalkContext = { origin: DOMRect; unsupported: { nodeId: string; reason: string }[] }

function walk(element: HTMLElement, context: WalkContext): VectorPrimitive[] {
	const style = getComputedStyle(element)
	if (style.display === 'none' || style.visibility === 'hidden') return []
	// 🔴 값이 없을 때를 0으로 읽으면 판 전체가 사라진다 — `Number('')`은 0이다.
	const parsedOpacity = Number.parseFloat(style.opacity)
	const opacity = Number.isFinite(parsedOpacity) ? parsedOpacity : 1
	if (opacity === 0) return []

	const box = toBox(element.getBoundingClientRect(), context.origin)
	if (box.width <= 0 || box.height <= 0) return []

	const nodeId = element.dataset.nodeId ?? element.dataset.name ?? element.tagName.toLowerCase()
	reportUnsupported(style, nodeId, context)

	const own =
		element instanceof HTMLImageElement
			? imagePrimitives(element, box, style)
			: element.tagName === 'P'
				? textPrimitives(element, style, context)
				: boxPrimitives(box, style)

	const children = Array.from(element.children).flatMap((child) =>
		child instanceof HTMLElement ? walk(child, context) : [],
	)
	const contents = [...own, ...children]
	if (contents.length === 0) return []

	// 레이어 이름을 살려 둔다 — 인쇄용이라 구조는 깨져도 되지만, 이름은 문제 추적에 쓰인다.
	return [
		{
			kind: 'group',
			label: element.dataset.name ?? nodeId,
			...(opacity < 1 ? { opacity } : {}),
			children: contents,
		},
	]
}

/** 벡터로 못 옮기는 효과를 기록한다. 여기서 버리면 폴백이 무엇을 구워야 할지 알 수 없다. */
function reportUnsupported(style: CSSStyleDeclaration, nodeId: string, context: WalkContext) {
	const effects: [string, boolean][] = [
		['gradient', style.backgroundImage.includes('gradient')],
		['box-shadow', style.boxShadow !== 'none' && style.boxShadow !== ''],
		['filter', style.filter !== 'none' && style.filter !== ''],
		['backdrop-filter', style.backdropFilter !== 'none' && style.backdropFilter !== ''],
		['mask', maskUrl(style) !== null],
		['blend-mode', style.mixBlendMode !== 'normal' && style.mixBlendMode !== ''],
	]
	for (const [reason, hit] of effects) {
		if (hit) context.unsupported.push({ nodeId, reason })
	}
}

/** CSS mask로 얹힌 벡터 자산의 URL. 로고가 이 형태로 들어온다(compose가 maskImage로 심는다). */
export function maskUrl(style: CSSStyleDeclaration): string | null {
	const value = style.maskImage || style.webkitMaskImage || ''
	if (!value || value === 'none') return null
	return value.match(/url\(["']?(.*?)["']?\)/)?.[1] ?? null
}

function boxPrimitives(box: Box, style: CSSStyleDeclaration): VectorPrimitive[] {
	const fill = solidColor(style.backgroundColor)
	const border = borderOf(style)
	if (!fill && !border) return []
	return [
		{
			kind: 'rect',
			...box,
			...(fill ? { fill } : {}),
			...(border ? { stroke: border.color, strokeWidth: border.width } : {}),
			...(uniformRadius(style) ? { radius: uniformRadius(style) as number } : {}),
		},
	]
}

function imagePrimitives(
	element: HTMLImageElement,
	box: Box,
	style: CSSStyleDeclaration,
): VectorPrimitive[] {
	if (!element.currentSrc && !element.src) return []
	return [
		{
			kind: 'image',
			...box,
			href: element.currentSrc || element.src,
			preserveAspectRatio: preserveAspectRatioOf(style.objectFit),
		},
	]
}

/**
 * 문단을 **줄 단위**로 뽑는다. 문단 하나를 `<text>` 하나로 내면 원래 줄바꿈이 사라지고,
 * 받는 쪽 서체 폭에 따라 다시 흘러 조판이 달라진다.
 */
function textPrimitives(
	element: HTMLElement,
	style: CSSStyleDeclaration,
	context: WalkContext,
): VectorPrimitive[] {
	const fill = solidColor(style.color) ?? '#000000'
	const fontSize = Number.parseFloat(style.fontSize) || 0
	if (fontSize <= 0) return []
	const anchor = textAnchorOf(style.textAlign)

	return lineRects(element).flatMap(({ rect, text }) => {
		const box = toBox(rect, context.origin)
		if (!text.trim() || box.width <= 0) return []
		return [
			{
				kind: 'text' as const,
				x:
					anchor === 'middle'
						? box.x + box.width / 2
						: anchor === 'end'
							? box.x + box.width
							: box.x,
				// baseline은 줄 상자 바닥에서 descent만큼 올린 자리다. 정확한 descent는 서체를 열어야
				// 알 수 있어서, 아웃라인 단계가 실측으로 덮는다(여기 값은 미리보기용 근사다).
				y: box.y + box.height - fontSize * 0.21,
				text,
				fontFamily: style.fontFamily,
				fontSize,
				...(Number(style.fontWeight) ? { fontWeight: Number(style.fontWeight) } : {}),
				...(letterSpacingOf(style) !== null
					? { letterSpacing: letterSpacingOf(style) as number }
					: {}),
				fill,
				...(anchor !== 'start' ? { textAnchor: anchor } : {}),
			},
		]
	})
}

/**
 * 텍스트 노드를 **렌더된 줄**로 자른다.
 *
 * 🔑 줄은 브라우저가 이미 나눠 두었다 — `getClientRects()`의 개수가 곧 줄 수다. 경계 인덱스만
 *    이분 탐색으로 찾아 글자를 짝지운다. 글자마다 재면 문단 하나에 레이아웃 읽기가 수백 번 걸린다.
 */
function lineRects(element: HTMLElement): { rect: DOMRect; text: string }[] {
	const ownerDocument = element.ownerDocument
	const walker = ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT)
	const lines: { rect: DOMRect; text: string }[] = []

	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const content = node.textContent ?? ''
		if (!content.trim()) continue
		const range = ownerDocument.createRange()
		range.selectNodeContents(node)
		if (range.getClientRects().length <= 1) {
			lines.push({ rect: range.getBoundingClientRect(), text: content })
			continue
		}

		let start = 0
		while (start < content.length) {
			const breakAt = findLineBreak(range, node, start, content.length)
			range.setStart(node, start)
			range.setEnd(node, breakAt)
			lines.push({ rect: range.getBoundingClientRect(), text: content.slice(start, breakAt) })
			if (breakAt === start) break
			start = breakAt
		}
	}
	return lines
}

/**
 * `start`에서 시작하는 줄이 끝나는 인덱스. 범위를 늘리다 줄 상자가 2개가 되는 첫 지점 직전이다.
 * 「상자 개수 ≥ 2」는 끝 인덱스에 대해 단조라서 이분 탐색이 성립한다.
 */
function findLineBreak(range: Range, node: Node, start: number, length: number): number {
	range.setStart(node, start)
	range.setEnd(node, length)
	if (range.getClientRects().length <= 1) return length

	let low = start + 1
	let high = length
	while (low < high) {
		const middle = (low + high) >> 1
		range.setEnd(node, middle)
		if (range.getClientRects().length > 1) high = middle
		else low = middle + 1
	}
	// low는 줄이 넘어간 첫 인덱스다 — 그 직전까지가 이 줄이다.
	return Math.max(start + 1, low - 1)
}

function toBox(rect: DOMRect, origin: DOMRect): Box {
	return {
		x: rect.left - origin.left,
		y: rect.top - origin.top,
		width: rect.width,
		height: rect.height,
	}
}

/** 투명하지 않은 단색만 돌려준다 — `rgba(0,0,0,0)`은 배경 없음이지 검정이 아니다. */
export function solidColor(value: string): string | null {
	const match = value.match(/rgba?\(([^)]+)\)/)
	if (!match) return value.startsWith('#') ? value : null
	const parts = match[1]
		.split(/[,/\s]+/)
		.filter(Boolean)
		.map(Number)
	const [r, g, b, a = 1] = parts
	if (!Number.isFinite(r) || a === 0) return null
	return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

function borderOf(style: CSSStyleDeclaration): { color: string; width: number } | null {
	const width = Number.parseFloat(style.borderTopWidth) || 0
	const color = solidColor(style.borderTopColor)
	return width > 0 && color && style.borderTopStyle !== 'none' ? { color, width } : null
}

/** SVG `rx`는 네 모서리가 같을 때만 참이다 — 다르면 path로 내려가야 하므로 여기서는 포기한다. */
function uniformRadius(style: CSSStyleDeclaration): number | null {
	const corners = [
		style.borderTopLeftRadius,
		style.borderTopRightRadius,
		style.borderBottomRightRadius,
		style.borderBottomLeftRadius,
	].map((value) => Number.parseFloat(value) || 0)
	const [first] = corners
	return first > 0 && corners.every((corner) => corner === first) ? first : null
}

function preserveAspectRatioOf(objectFit: string): string {
	if (objectFit === 'contain') return 'xMidYMid meet'
	if (objectFit === 'cover') return 'xMidYMid slice'
	return 'none'
}

function textAnchorOf(textAlign: string): 'start' | 'middle' | 'end' {
	if (textAlign === 'center') return 'middle'
	if (textAlign === 'right' || textAlign === 'end') return 'end'
	return 'start'
}

function letterSpacingOf(style: CSSStyleDeclaration): number | null {
	const value = Number.parseFloat(style.letterSpacing)
	return Number.isFinite(value) && value !== 0 ? value : null
}
