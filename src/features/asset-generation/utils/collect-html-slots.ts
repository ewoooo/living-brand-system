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

/**
 * HTML 템플릿에서 열린 입력 슬롯(input이 달린 텍스트 노드)을 문서 순서로 모은다.
 * input은 텍스트 노드(<p data-node-id>)에만 유효 — 다른 노드나 base에 없는 노드의 input은
 * 고아 오버라이드처럼 조용히 무시한다. 브라우저 DOMParser를 쓰므로 클라이언트 전용.
 */
export function collectHtmlSlots(html: string, overrides: TemplateOverrides): HtmlSlot[] {
	if (!html) return []

	const doc = new DOMParser().parseFromString(html, 'text/html')

	return Array.from(doc.querySelectorAll('p[data-node-id]')).flatMap((el) => {
		const nodeId = el.getAttribute('data-node-id')
		const input = nodeId ? overrides[nodeId]?.input : undefined
		if (!nodeId || !input) return []

		return [
			{
				nodeId,
				name: el.getAttribute('data-name') || nodeId,
				text: el.textContent ?? '',
				input,
			},
		]
	})
}
