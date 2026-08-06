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

/** compose가 컬러 치환용으로 만든 오버레이 노드 id — 편집 UI(레이어 패널)에서 숨기는 판별 계약. */
export function isImageColorizeOverlayId(nodeId: string): boolean {
	return nodeId.endsWith('-colorize')
}

/**
 * 컬러 치환: 생성 이미지(단색 라인 아트)를 luminance 마스크로 써서 캐리어를 2겹으로 재구성한다.
 * 바닥(캐리어)=line 색, 오버레이(자식)=background 색 — 마스크의 밝은 영역만 배경색이 남고
 * 어두운 선 부분은 바닥의 line 색이 비친다(안티앨리어싱 경계는 luminance 비율로 혼합).
 * background 생략 시 캔버스(루트) 배경색으로 자동 유도한다(폴백 #ffffff).
 * 발행 검증(metadataRef)이 style URL과 data-asset-*의 동일 요소 짝을 요구하므로 에셋 참조를
 * 마스크 URL을 가진 오버레이로 옮기고, URL을 잃은 캐리어에서는 제거한다.
 * 반환값은 박스·transform을 소유하는 요소 — img 캐리어는 div로 치환돼 캐리어가 바뀐다.
 */
function applyImageColorize(
	doc: Document,
	carrier: HTMLElement,
	colorize: NonNullable<TemplateNodeConfig['imageColorize']>,
	imageUrl: string,
): HTMLElement {
	let base = carrier
	if (carrier instanceof HTMLImageElement) {
		// 래스터 폴백 img 캐리어는 vectorColor와 같은 방식으로 div 치환 — mask는 img 콘텐츠에 못 얹는다.
		const replaced = doc.createElement('div')
		for (const attribute of Array.from(carrier.attributes)) {
			if (!['alt', 'src', 'srcset'].includes(attribute.name)) {
				replaced.setAttribute(attribute.name, attribute.value)
			}
		}
		carrier.replaceWith(replaced)
		base = replaced
	}

	// 배경색 자동 유도: background 생략 시 캔버스(템플릿 루트) 배경색을 따른다. Image Area
	// 프레임은 자체 흰 fill을 갖는 경우가 많지만 오버사이즈 캐리어가 프레임을 통째로 덮으므로
	// 매끄럽게 녹아들 대상은 가장 가까운 조상이 아니라 캔버스다. import가 루트에 background:
	// 쇼트핸드로 방출한 색을 CSSOM이 backgroundColor로 노출한다.
	// ponytail: 섹션별 배경이 다른 템플릿은 루트 근사 — 필요 시 background를 직접 지정한다.
	const root = doc.body.firstElementChild
	const background =
		colorize.background ??
		((root instanceof HTMLElement && root.style.backgroundColor) || '#ffffff')

	const overlay = doc.createElement('div')
	// 검증이 모든 요소에 유일한 data-node-id를 요구한다 — 캐리어 id에서 파생한 합성 id를 준다.
	overlay.setAttribute('data-node-id', `${base.getAttribute('data-node-id')}-colorize`)
	// 캐리어(임포트가 절대배치·크기를 굳힘)를 기준 박스로 꽉 채운다 — inset은 허용 목록에 없다.
	overlay.style.position = 'absolute'
	overlay.style.left = '0'
	overlay.style.top = '0'
	overlay.style.width = '100%'
	overlay.style.height = '100%'
	overlay.style.backgroundColor = background
	overlay.style.maskImage = `url("${imageUrl}")`
	overlay.style.maskMode = 'luminance'
	// 프레이밍은 치환 전 렌더와 동일하게 — background-*를 mask-*로 옮긴다(img는 기본 fill 상당).
	overlay.style.maskSize = base.style.backgroundSize || '100% 100%'
	overlay.style.maskPosition = base.style.backgroundPosition || 'center'
	overlay.style.maskRepeat = base.style.backgroundRepeat || 'no-repeat'
	for (const name of ['data-asset-collection', 'data-asset-id']) {
		const value = base.getAttribute(name)
		if (value !== null) overlay.setAttribute(name, value)
		base.removeAttribute(name)
	}

	base.style.backgroundImage = ''
	base.style.backgroundSize = ''
	base.style.backgroundPosition = ''
	base.style.backgroundRepeat = ''
	base.style.backgroundColor = colorize.line
	base.appendChild(overlay)
	return base
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
				// 컬러 치환은 transform보다 먼저 — img 캐리어가 div로 치환될 수 있고, transform은
				// 치환 결과(2겹 전체)의 캐리어에 붙어야 이동·회전이 컬러 결과를 통째로 움직인다.
				const visual = config.imageColorize
					? applyImageColorize(doc, carrier, config.imageColorize, config.backgroundImage)
					: carrier
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
					const baseTransform = visual.style.transform
					visual.style.transform = baseTransform
						? `${editTransform} ${baseTransform}`
						: editTransform
				}
			} else if (el instanceof HTMLImageElement) {
				// 캐리어 아닌 래스터 폴백 img에 background-*를 칠하면 불투명한 src 뒤에 가려
				// 보이지 않고, 발행 검증(metadataRef)은 img의 src를 읽어 data-asset-*와
				// 어긋난다 — 캐리어 img와 동일하게 src 자체를 갈아끼운다.
				el.src = config.backgroundImage
				el.removeAttribute('srcset')
				if (config.generatedImageId) {
					el.setAttribute('data-asset-collection', 'generated-images')
					el.setAttribute('data-asset-id', String(config.generatedImageId))
				}
			} else {
				// ponytail: 캐리어 없는 레거시 프레임 배경 경로에서는 imageTransform·imageColorize를
				// 무시한다 — background-image는 회전할 수 없고 자식을 얹으면 기존 자식(placeholder)을
				// 가리므로 두 변형 모두 설계상 캐리어 전용이다.
				// base가 background: 쇼트핸드(import가 단색·그라데이션 fill에 방출)면 Chrome이
				// 아래 롱핸드 세팅을 쇼트핸드 하나로 재직렬화해 `background: url(...) ... rgb(...)`를
				// 만들고, 스타일 검증은 background 쇼트핸드의 url()을 차단해 저장이 막힌다
				// (jsdom은 이 재직렬화를 재현하지 못한다 — 실제 Chromium에서 검증된 동작).
				// 쇼트핸드를 지우고 색만 롱핸드로 보존한다 — 그라데이션 레이어는 cover 이미지가
				// 어차피 덮으므로 시각 손실이 없다.
				const keptColor = el.style.backgroundColor
				el.style.background = ''
				if (keptColor) el.style.backgroundColor = keptColor
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
