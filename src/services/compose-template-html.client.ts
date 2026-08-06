'use client'

import type { TemplateNodeConfig, TemplateNodeConfigMap } from '@/types/template'

/**
 * 편집 transform 문자열의 단일 소유자 — compose(커밋 반영)와 캔버스 오버레이의 라이브
 * 피드백이 같은 포맷을 써야 오버레이가 캐리어 inline transform에서 커밋된 편집 prefix를
 * 결정적으로 벗겨내 base transform을 복원할 수 있다.
 */
export function formatImageEditTransform(
	edit: NonNullable<TemplateNodeConfig['imageTransform']>,
): string {
	return `translate(${edit.x}px, ${edit.y}px) scale(${edit.scale}) rotate(${edit.rotate}deg)`
}

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
			// import가 캐리어(data-image-carrier)로 표시한 요소의 이미지를 갈아끼운다 — 프레임 배경에
			// 쓰면 위에 얹힌 placeholder 자식이 이미지를 가린다. 캐리어 사각형을 직접 선택해 설정한
			// 경우 요소 자신이 캐리어다(querySelector는 자손만 봐서 자신을 놓친다).
			const carrier = el.matches('[data-image-carrier]')
				? el
				: el.querySelector('[data-image-carrier]')
			if (carrier instanceof HTMLElement) {
				if (carrier instanceof HTMLImageElement) {
					carrier.src = config.backgroundImage
					carrier.removeAttribute('srcset')
				} else {
					carrier.style.backgroundImage = `url("${config.backgroundImage}")`
					// import가 scaleMode에서 굳힌 background-size/position은 보존하고 없을 때만 기본값.
					if (!carrier.style.backgroundSize) carrier.style.backgroundSize = 'cover'
					if (!carrier.style.backgroundPosition) {
						carrier.style.backgroundPosition = 'center'
					}
					if (!carrier.style.backgroundRepeat)
						carrier.style.backgroundRepeat = 'no-repeat'
				}
				if (config.generatedImageId) {
					// 발행 검증(metadataRef)이 요소의 data-asset-*와 실제 URL의 일치를 요구하므로
					// placeholder 에셋 참조를 생성 이미지 참조로 바꾼다.
					carrier.setAttribute('data-asset-collection', 'generated-images')
					carrier.setAttribute('data-asset-id', String(config.generatedImageId))
				}
				const edit = config.imageTransform
				if (
					edit &&
					!(edit.x === 0 && edit.y === 0 && edit.scale === 1 && edit.rotate === 0)
				) {
					// 합성 규칙: 편집 transform을 import가 만든 base transform 앞에 붙인다(prepend).
					// 맨 왼쪽 CSS transform이 부모(프레임) 좌표계에서 적용되므로 pan이 프레임 안에서
					// 이미지를 옮기는 느낌이 되고, Figma 소유의 base transform(rotate 등)은 보존된다.
					// transform-origin은 기본값(center) 유지. identity(0,0,1,0)면 아무것도 쓰지 않는다.
					const editTransform = formatImageEditTransform(edit)
					const baseTransform = carrier.style.transform
					carrier.style.transform = baseTransform
						? `${editTransform} ${baseTransform}`
						: editTransform
				}
			} else {
				// ponytail: 캐리어 없는 레거시 프레임 배경 경로에서는 imageTransform을 무시한다 —
				// background-image는 회전할 수 없으므로 이 변형은 설계상 캐리어 전용이다.
				el.style.backgroundImage = `url("${config.backgroundImage}")`
				el.style.backgroundSize = 'cover'
				el.style.backgroundPosition = 'center'
				el.style.backgroundRepeat = 'no-repeat'
				if (config.generatedImageId && el.hasAttribute('data-asset-collection')) {
					// IMAGE fill을 직접 가진 요소(placeholder 참조 보유)에 생성 이미지를 얹는 경우 —
					// 발행 검증이 요소의 data-asset-*와 URL 일치를 요구하므로 참조를 함께 바꾼다.
					el.setAttribute('data-asset-collection', 'generated-images')
					el.setAttribute('data-asset-id', String(config.generatedImageId))
				}
			}
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
