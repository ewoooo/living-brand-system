import type { TemplateNodeConfigMap, TemplateSlotSpec } from '@/types/template'

export interface TemplateSlot {
	nodeId: string
	name: string
	text: string
	input: TemplateSlotSpec
}

export interface TemplateImageSlot {
	nodeId: string
	name: string
	/** 제작자가 고정한 이미지 프로파일 — 없으면 유저가 스튜디오에서 선택한다. */
	profileId?: number
	/** 슬롯 요소 자신의 inline width/height(px) — 캐리어는 정규식으로 서브트리 판별이 불안정해 clipsContent 프레임의 가시 박스인 자신을 쓴다. */
	boxWidth?: number
	boxHeight?: number
}

// 서버(agent tool)와 브라우저 양쪽에서 돌도록 DOMParser 대신 정규식으로 읽는다.
// 대상 html은 우리 컨버터(figma-node-to-html)가 만든 1급 산출물이라 텍스트 노드는
// 항상 자식 요소 없는 `<p … data-node-id="…" …>이스케이프된 텍스트</p>` 형태다.
const TEXT_NODE_PATTERN = /<p\b([^>]*)>([\s\S]*?)<\/p>/g

// 이미지 슬롯은 프레임(div 등 비텍스트 요소)에 붙는다 — 여는 태그만 문서 순서로 훑는다.
const OPEN_TAG_PATTERN = /<([a-z]+)\b([^>]*)>/g

function readAttr(attrs: string, name: string): string | undefined {
	return new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1]
}

// emit이 굳힌 inline style에서 px 치수만 읽는다 — min-width 등 접두 속성은 경계 문자로 걸러진다.
function readPxDimension(style: string | undefined, property: string): number | undefined {
	if (!style) return undefined
	const raw = new RegExp(`(?:^|[;\\s"])${property}:\\s*(\\d*\\.?\\d+)px`).exec(style)?.[1]
	const parsed = raw ? Number(raw) : Number.NaN
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function unescapeHtml(text: string): string {
	return text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
}

/**
 * HTML 템플릿에서 열린 입력 슬롯(input이 달린 텍스트 노드)을 문서 순서로 모은다.
 * input은 텍스트 노드에만 유효 — 다른 노드나 base에 없는 노드의 input은
 * 고아 오버라이드처럼 조용히 무시한다.
 * 외부 I/O는 없으며 호출 Use Case가 조회·저장 경계를 소유한다.
 */
export function collectTemplateSlots(
	html: string,
	nodeConfigs: TemplateNodeConfigMap,
): TemplateSlot[] {
	if (!html) return []

	const slots: TemplateSlot[] = []

	for (const match of html.matchAll(TEXT_NODE_PATTERN)) {
		const attrs = match[1] ?? ''
		const nodeId = readAttr(attrs, 'data-node-id')
		const input = nodeId ? nodeConfigs[nodeId]?.input : undefined
		if (!nodeId || !input) continue

		slots.push({
			nodeId,
			name: unescapeHtml(readAttr(attrs, 'data-name') || nodeId),
			text: unescapeHtml(match[2] ?? ''),
			input,
		})
	}

	return slots
}

/**
 * HTML 템플릿에서 스튜디오에 개방된 이미지 슬롯(imageInput이 달린 노드)을 문서 순서로 모은다.
 * imageInput은 텍스트 노드(<p>)에는 무효 — base에 없는 노드의 imageInput은 고아 오버라이드처럼 조용히 무시한다.
 * 외부 I/O는 없으며 호출 Use Case가 조회·저장 경계를 소유한다.
 */
export function collectTemplateImageSlots(
	html: string,
	nodeConfigs: TemplateNodeConfigMap,
): TemplateImageSlot[] {
	if (!html) return []

	const slots: TemplateImageSlot[] = []

	for (const match of html.matchAll(OPEN_TAG_PATTERN)) {
		if (match[1] === 'p') continue
		const attrs = match[2] ?? ''
		const nodeId = readAttr(attrs, 'data-node-id')
		const imageInput = nodeId ? nodeConfigs[nodeId]?.imageInput : undefined
		if (!nodeId || !imageInput) continue

		const style = readAttr(attrs, 'style')
		slots.push({
			nodeId,
			name: unescapeHtml(readAttr(attrs, 'data-name') || nodeId),
			profileId: imageInput.profileId,
			boxWidth: readPxDimension(style, 'width'),
			boxHeight: readPxDimension(style, 'height'),
		})
	}

	return slots
}
