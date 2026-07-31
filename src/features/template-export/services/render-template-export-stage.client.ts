'use client'

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
 * 검증된 canonical HTML을 안전한 export stage로 구성하고 리소스 로드를 기다리는 client renderer.
 * DOM 구성과 브라우저 리소스 I/O는 이 adapter가 소유한다.
 */
export async function withSafeExportStage<T>(
	html: string,
	css: string,
	exportStage: (stage: HTMLElement) => Promise<T>,
): Promise<T> {
	const { holder, stage } = createSafeExportStage(html, css)
	document.body.appendChild(holder)
	try {
		await waitForExportStageAssets(stage)
		return await exportStage(stage)
	} finally {
		holder.remove()
	}
}

/** export stage의 img·inline CSS 이미지·폰트가 준비될 때까지 기다린다. */
export async function waitForExportStageAssets(stage: HTMLElement): Promise<void> {
	const ownerDocument = stage.ownerDocument
	const ownerWindow = ownerDocument.defaultView ?? window
	await new Promise((resolve) => ownerWindow.requestAnimationFrame(resolve))

	const elements = [stage, ...Array.from(stage.querySelectorAll<HTMLElement>('*'))]
	const styleUrls = new Set<string>()
	for (const element of elements) {
		for (let index = 0; index < element.style.length; index += 1) {
			const urls = cssUrls(element.style.getPropertyValue(element.style.item(index)))
			for (const url of urls ?? []) styleUrls.add(url)
		}
	}

	await Promise.all([
		...Array.from(stage.querySelectorAll('img'), waitForImage),
		...Array.from(styleUrls, (url) => loadImage(ownerDocument, url)),
		ownerDocument.fonts?.ready,
	])
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
	if (!image.complete) {
		await new Promise<void>((resolve, reject) => {
			image.addEventListener('load', () => resolve(), { once: true })
			image.addEventListener(
				'error',
				() => reject(new Error('Template export asset failed to load.')),
				{ once: true },
			)
		})
	}
	await image.decode()
}

async function loadImage(ownerDocument: Document, url: string): Promise<void> {
	const image = ownerDocument.createElement('img')
	image.src = url
	await waitForImage(image)
}
