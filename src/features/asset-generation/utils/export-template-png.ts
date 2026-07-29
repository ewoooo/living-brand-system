import { toPng } from 'html-to-image'

const EXPORT_TAGS = new Set(['div', 'img', 'p'])
const EXPORT_DATA_ATTRIBUTES = new Set([
	'data-asset-collection',
	'data-asset-id',
	'data-figma-type',
	'data-name',
	'data-nimg',
	'data-node-id',
])
const EXPORT_IMAGE_ATTRIBUTES = new Set(['alt', 'decoding', 'height', 'loading', 'sizes', 'width'])
const CSS_URL_PATTERN = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^"'()\s]+))\s*\)/gi

function isSafeExportUrl(value: string): boolean {
	if (
		value.startsWith('data:image/png;base64,') ||
		value.startsWith('data:image/jpeg;base64,') ||
		value.startsWith('data:image/webp;base64,')
	) {
		return value.length <= 14 * 1024 * 1024
	}

	const url = new URL(value, window.location.origin)
	if (url.protocol === 'blob:') return url.origin === window.location.origin
	if (url.origin !== window.location.origin || url.search || url.hash) return false
	return ['brand-logos', 'application-images'].some((collection) =>
		url.pathname.startsWith(`/api/${collection}/file/`),
	)
}

function cssUrls(value: string): string[] | null {
	const urls: string[] = []
	const remainder = value.replace(CSS_URL_PATTERN, (_match, double, single, bare) => {
		urls.push(double ?? single ?? bare)
		return ''
	})
	if (/url\s*\(|(?:-webkit-)?image-set\s*\(/i.test(remainder)) return null
	return urls
}

function copySafeStyle(source: HTMLElement, target: HTMLElement) {
	for (let index = 0; index < source.style.length; index += 1) {
		const property = source.style.item(index)
		const value = source.style.getPropertyValue(property)
		if (value.includes('\\')) {
			throw new Error('Template export contains an unsafe CSS escape.')
		}
		const urls = cssUrls(value)
		if (!urls || urls.some((url) => !isSafeExportUrl(url))) {
			throw new Error('Template export contains an unsafe CSS URL.')
		}
		target.style.setProperty(property, value, source.style.getPropertyPriority(property))
	}
}

function cloneSafeExportNode(node: Node): Node | null {
	if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? '')
	if (!(node instanceof HTMLElement)) return null

	const tagName = node.tagName.toLowerCase()
	if (!EXPORT_TAGS.has(tagName)) throw new Error('Template export contains an unsafe tag.')

	const clone = document.createElement(tagName)
	for (const attribute of node.attributes) {
		const name = attribute.name.toLowerCase()
		if (name.startsWith('on')) throw new Error('Template export contains an event handler.')
		if (name === 'id' || EXPORT_DATA_ATTRIBUTES.has(name)) {
			clone.setAttribute(name, attribute.value)
		} else if (tagName === 'img' && name === 'src') {
			if (!isSafeExportUrl(attribute.value)) {
				throw new Error('Template export contains an unsafe image URL.')
			}
			clone.setAttribute(name, attribute.value)
		} else if (tagName === 'img' && EXPORT_IMAGE_ATTRIBUTES.has(name)) {
			clone.setAttribute(name, attribute.value)
		}
	}
	copySafeStyle(node, clone)

	for (const child of node.childNodes) {
		const safeChild = cloneSafeExportNode(child)
		if (safeChild) clone.appendChild(safeChild)
	}
	return clone
}

function createSafeExportStage(
	html: string,
	css: string,
): { holder: HTMLDivElement; stage: HTMLElement } {
	if (
		/[\\@]/.test(css) ||
		/\/\*|\*\//.test(css) ||
		/url\s*\(|(?:-webkit-)?image-set\s*\(/i.test(css)
	) {
		throw new Error('Template export contains unsafe stylesheet I/O.')
	}

	// template.content는 inert DOM이라 script/event/resource를 실행하지 않는다. 검증한 노드만 새로 만든다.
	const parsed = document.createElement('template')
	parsed.innerHTML = html
	const holder = document.createElement('div')
	holder.style.cssText = 'position:fixed;left:-99999px;top:0'
	const shadow = holder.attachShadow({ mode: 'closed' })
	const style = document.createElement('style')
	style.textContent = css
	const wrapper = document.createElement('div')
	wrapper.dataset.exportStage = ''
	for (const child of parsed.content.childNodes) {
		const safeChild = cloneSafeExportNode(child)
		if (safeChild) wrapper.appendChild(safeChild)
	}
	shadow.append(style, wrapper)

	return {
		holder,
		stage: wrapper.querySelector<HTMLElement>('#__stage') ?? wrapper,
	}
}

/**
 * 샌드박스가 반송한 최종 배치 HTML을 inert DOM에서 검증·복제하고 Shadow DOM 안에서 PNG로 저장한다.
 * 외부 I/O URL, 실행 태그/속성, 전역 CSS는 부모 문서 경계를 넘지 못한다.
 */
export async function exportHtmlToPng(html: string, css: string, fileName: string): Promise<void> {
	const { holder, stage } = createSafeExportStage(html, css)
	document.body.appendChild(holder)
	try {
		await new Promise((resolve) => requestAnimationFrame(resolve))
		await Promise.all(
			Array.from(stage.querySelectorAll('img')).map(async (image) => {
				if (!image.complete) {
					await new Promise<void>((resolve) => {
						image.addEventListener('load', () => resolve(), { once: true })
						image.addEventListener('error', () => resolve(), { once: true })
					})
				}
				await image.decode().catch(() => undefined)
			}),
		)
		const dataUrl = await toPng(stage, { cacheBust: true })
		const link = document.createElement('a')
		link.href = dataUrl
		link.download = `${fileName}.png`
		link.click()
	} finally {
		holder.remove()
	}
}
