/**
 * 템플릿 렌더 HTML 합성: base(Figma import 원본) ⊕ overrides(앱 편집).
 *
 * 앱 편집(텍스트 교체·프레임 배경)을 base HTML에 직접 굽지 않고 nodeId로 키를 건 오버라이드로 따로 들고,
 * 렌더/저장 시 base 위에 다시 얹는다. 그래서 Figma에서 조금 고쳐 재import해도(=base만 갱신) 앱 작업이 보존된다.
 * base에서 사라진 노드의 오버라이드는 조용히 무시한다(우아한 degrade). 브라우저 DOMParser를 쓰므로 클라이언트 전용.
 */
export interface TemplateOverride {
	text?: string
	backgroundImage?: string
}

export type TemplateOverrides = Record<string, TemplateOverride>

export function composeTemplateHtml(baseHtml: string, overrides: TemplateOverrides): string {
	if (!baseHtml) return baseHtml
	if (!overrides || Object.keys(overrides).length === 0) return baseHtml

	const doc = new DOMParser().parseFromString(baseHtml, 'text/html')

	for (const [nodeId, override] of Object.entries(overrides)) {
		const el = doc.querySelector(`[data-node-id="${nodeId}"]`)
		if (!el) continue // 고아 오버라이드 — base에 더 이상 없는 노드. 무시.

		// 텍스트는 텍스트 노드(<p>)에만. background는 요소(HTMLElement)에.
		if (typeof override.text === 'string' && el.tagName.toLowerCase() === 'p') {
			el.textContent = override.text
		}
		if (override.backgroundImage && el instanceof HTMLElement) {
			el.style.backgroundImage = `url("${override.backgroundImage}")`
			el.style.backgroundSize = 'cover'
			el.style.backgroundPosition = 'center'
			el.style.backgroundRepeat = 'no-repeat'
		}
	}

	return doc.body.innerHTML
}
