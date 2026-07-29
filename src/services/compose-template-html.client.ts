'use client'

import type { TemplateNodeConfigMap } from '@/types/template'

/**
 * base HTML에 nodeId별 앱 설정을 적용해 Create·Chat·Import가 렌더할 HTML을 만든다.
 * 외부 I/O는 없으며 브라우저 DOMParser만 사용한다.
 */
export function composeTemplateHtml(baseHtml: string, nodeConfigs: TemplateNodeConfigMap): string {
	if (!baseHtml) return baseHtml
	if (!nodeConfigs || Object.keys(nodeConfigs).length === 0) return baseHtml

	const doc = new DOMParser().parseFromString(baseHtml, 'text/html')

	for (const [nodeId, config] of Object.entries(nodeConfigs)) {
		const el = Array.from(doc.querySelectorAll('[data-node-id]')).find(
			(candidate) => candidate.getAttribute('data-node-id') === nodeId,
		)
		if (!el) continue // base에 더 이상 없는 노드 설정은 무시한다.

		// 텍스트는 텍스트 노드(<p>)에만. background는 요소(HTMLElement)에.
		if (typeof config.text === 'string' && el.tagName.toLowerCase() === 'p') {
			el.textContent = config.text
		}
		if (config.backgroundImage && el instanceof HTMLElement) {
			el.style.backgroundImage = `url("${config.backgroundImage}")`
			el.style.backgroundSize = 'cover'
			el.style.backgroundPosition = 'center'
			el.style.backgroundRepeat = 'no-repeat'
		}

		if (el.tagName.toLowerCase() === 'img' && el instanceof HTMLElement) {
			const image = el as HTMLImageElement
			const src = config.vectorAsset?.src ?? image.getAttribute('src')
			const fit = config.vectorFit ?? 'fill'

			if (config.vectorAsset) {
				image.src = config.vectorAsset.src
				image.dataset.assetCollection = config.vectorAsset.collection
				image.dataset.assetId = String(config.vectorAsset.id)
			}
			image.style.objectFit = fit

			if (config.vectorColor && src) {
				const mask = doc.createElement('div')
				for (const attribute of Array.from(image.attributes)) {
					if (attribute.name !== 'src' && attribute.name !== 'alt') {
						mask.setAttribute(attribute.name, attribute.value)
					}
				}
				mask.style.backgroundColor = config.vectorColor
				mask.style.maskImage = `url("${src}")`
				mask.style.maskPosition = 'center'
				mask.style.maskRepeat = 'no-repeat'
				mask.style.maskSize = fit === 'contain' ? 'contain' : '100% 100%'
				mask.style.objectFit = ''
				image.replaceWith(mask)
			}
		}
	}

	return doc.body.innerHTML
}
