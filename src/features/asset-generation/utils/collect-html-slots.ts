import type {
	TemplateInput,
	TemplateOverrides,
} from '@/features/template-import/utils/compose-template-html'

export interface HtmlSlot {
	nodeId: string
	name: string
	text: string
	input: TemplateInput
}

// 서버(agent tool)와 브라우저 양쪽에서 돌도록 DOMParser 대신 정규식으로 읽는다.
// 대상 html은 우리 컨버터(figma-node-to-html)가 만든 1급 산출물이라 텍스트 노드는
// 항상 자식 요소 없는 `<p … data-node-id="…" …>이스케이프된 텍스트</p>` 형태다.
const TEXT_NODE_PATTERN = /<p\b([^>]*)>([\s\S]*?)<\/p>/g

function readAttr(attrs: string, name: string): string | undefined {
	return new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1]
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
 */
export function collectHtmlSlots(html: string, overrides: TemplateOverrides): HtmlSlot[] {
	if (!html) return []

	const slots: HtmlSlot[] = []

	for (const match of html.matchAll(TEXT_NODE_PATTERN)) {
		const attrs = match[1] ?? ''
		const nodeId = readAttr(attrs, 'data-node-id')
		const input = nodeId ? overrides[nodeId]?.input : undefined
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
