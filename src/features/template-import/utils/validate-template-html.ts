import { Parser } from 'htmlparser2'
import { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'
import type { AuthorizedImageRef } from './validate-authorized-assets'

type AuthorizedAssetCollection = (typeof AUTHORIZED_ASSET_COLLECTIONS)[number]

const ALLOWED_TAGS = new Set(['div', 'img', 'p'])
const COMMON_ATTRIBUTES = new Set(['data-figma-type', 'data-name', 'data-node-id', 'style'])
const ASSET_ATTRIBUTES = new Set(['data-asset-collection', 'data-asset-id'])
const IMAGE_ATTRIBUTES = new Set(['alt', 'src'])
const SAFE_NODE_ID = /^[a-zA-Z0-9:;_-]+$/

const ALLOWED_STYLE_PROPERTIES = new Set([
	'align-content',
	'align-items',
	'align-self',
	'backdrop-filter',
	'background',
	'background-color',
	'background-image',
	'background-position',
	'background-repeat',
	'background-size',
	'border',
	'border-bottom-width',
	'border-color',
	'border-left-width',
	'border-radius',
	'border-right-width',
	'border-style',
	'border-top-width',
	'bottom',
	'box-shadow',
	'box-sizing',
	'color',
	'column-gap',
	'display',
	'filter',
	'flex-direction',
	'flex-grow',
	'flex-wrap',
	'font-family',
	'font-size',
	'font-style',
	'font-weight',
	'gap',
	'grid-auto-flow',
	'grid-column',
	'grid-row',
	'grid-template-columns',
	'grid-template-rows',
	'height',
	'justify-content',
	'justify-self',
	'left',
	'letter-spacing',
	'line-height',
	'margin',
	'mask-image',
	'mask-position',
	'mask-repeat',
	'mask-size',
	'mix-blend-mode',
	'object-fit',
	'opacity',
	'overflow',
	'padding',
	'position',
	'right',
	'row-gap',
	'text-align',
	'text-decoration',
	'text-transform',
	'top',
	'transform',
	'white-space',
	'width',
])
const URL_STYLE_PROPERTIES = new Set(['background-image', 'mask-image'])
const MAX_RASTER_BYTES = 10 * 1024 * 1024
const MAX_RASTER_DATA_URL_LENGTH =
	'data:image/jpeg;base64,'.length + 4 * Math.ceil(MAX_RASTER_BYTES / 3)

interface InspectedFragment {
	blocker?: string
	nodeIds: Set<string>
	refs: AuthorizedImageRef[]
}

export interface TemplateHtmlInspection {
	blocker?: string
	refs: AuthorizedImageRef[]
}

function isAuthorizedCollection(value: string): value is AuthorizedAssetCollection {
	return (AUTHORIZED_ASSET_COLLECTIONS as readonly string[]).includes(value)
}

function hasUnsafeControlCharacter(value: string, allowWhitespace = false): boolean {
	for (const character of value) {
		const code = character.charCodeAt(0)
		if (code === 127 || (code < 32 && (!allowWhitespace || ![9, 10, 13].includes(code)))) {
			return true
		}
	}
	return false
}

function containsCssFunction(value: string, name: string): boolean {
	const lower = value.toLowerCase()
	let cursor = 0

	while (cursor < lower.length) {
		const index = lower.indexOf(name, cursor)
		if (index < 0) return false
		const before = index === 0 ? '' : lower[index - 1]
		let after = index + name.length
		while (after < lower.length && /\s/.test(lower[after] ?? '')) after += 1
		if ((!before || !/[a-z0-9_-]/.test(before)) && lower[after] === '(') return true
		cursor = index + name.length
	}

	return false
}

function splitStyleDeclarations(style: string): string[] | null {
	const declarations: string[] = []
	let start = 0
	let quote = ''
	let parentheses = 0

	for (let index = 0; index < style.length; index += 1) {
		const character = style[index] ?? ''
		if (quote) {
			if (character === quote) quote = ''
			continue
		}
		if (character === '"' || character === "'") {
			quote = character
			continue
		}
		if (character === '(') parentheses += 1
		else if (character === ')') {
			if (parentheses === 0) return null
			parentheses -= 1
		} else if (character === ';' && parentheses === 0) {
			declarations.push(style.slice(start, index))
			start = index + 1
		}
	}

	if (quote || parentheses !== 0) return null
	declarations.push(style.slice(start))
	return declarations
}

function inspectStyle(style: string): { blocker?: string; urls: string[] } {
	if (
		hasUnsafeControlCharacter(style, true) ||
		style.includes('\\') ||
		style.includes('/*') ||
		style.includes('*/') ||
		style.includes('@')
	) {
		return { blocker: 'HTML style에 허용하지 않는 CSS 구문이 있습니다.', urls: [] }
	}

	const declarations = splitStyleDeclarations(style)
	if (!declarations) return { blocker: 'HTML style 선언 형식이 올바르지 않습니다.', urls: [] }

	const urls: string[] = []
	for (const rawDeclaration of declarations) {
		const declaration = rawDeclaration.trim()
		if (!declaration) continue

		const separator = declaration.indexOf(':')
		if (separator <= 0) {
			return { blocker: 'HTML style 선언 형식이 올바르지 않습니다.', urls: [] }
		}

		const property = declaration.slice(0, separator).trim()
		const value = declaration.slice(separator + 1).trim()
		if (property !== property.toLowerCase() || !ALLOWED_STYLE_PROPERTIES.has(property)) {
			return { blocker: `HTML style에서 허용하지 않는 속성입니다: ${property}`, urls: [] }
		}
		if (!value) return { blocker: `HTML style 속성 값이 비어 있습니다: ${property}`, urls: [] }
		if (value.toLowerCase().includes('!important')) {
			return {
				blocker: `HTML style에서 !important를 사용할 수 없습니다: ${property}`,
				urls: [],
			}
		}

		if (property === 'position' && value !== 'absolute' && value !== 'relative') {
			return { blocker: 'HTML style의 position 값이 허용 범위를 벗어났습니다.', urls: [] }
		}
		if (property === 'display' && !['block', 'flex', 'grid'].includes(value)) {
			return { blocker: 'HTML style의 display 값이 허용 범위를 벗어났습니다.', urls: [] }
		}

		const hasUrl = containsCssFunction(value, 'url')
		const hasIndirectImage = [
			'-webkit-image-set',
			'element',
			'image',
			'image-set',
			'paint',
			'src',
		].some((name) => containsCssFunction(value, name))
		if (hasIndirectImage) {
			return { blocker: 'HTML style의 동적 이미지 함수는 사용할 수 없습니다.', urls: [] }
		}

		if (!URL_STYLE_PROPERTIES.has(property)) {
			if (hasUrl) return { blocker: 'HTML style URL 위치가 허용되지 않습니다.', urls: [] }
			continue
		}

		const match = value.match(/^url\(\s*(?:"([^"]+)"|'([^']+)'|([^"'()\s]+))\s*\)$/i)
		const url = match?.[1] ?? match?.[2] ?? match?.[3]
		if (!hasUrl || !url || hasUnsafeControlCharacter(url)) {
			return { blocker: 'HTML style URL 형식이 올바르지 않습니다.', urls: [] }
		}
		urls.push(url)
	}

	return { urls }
}

function isCanonicalAssetUrl(value: string, collections: readonly string[]): boolean {
	if (
		!value.startsWith('/') ||
		value.startsWith('//') ||
		value.includes('?') ||
		value.includes('#') ||
		value.includes('\\') ||
		hasUnsafeControlCharacter(value)
	) {
		return false
	}

	const url = new URL(value, 'http://template.local')
	if (url.pathname !== value) return false
	return collections.some((collection) => value.startsWith(`/api/${collection}/file/`))
}

function isSafeRasterDataUrl(value: string): boolean {
	if (value.length > MAX_RASTER_DATA_URL_LENGTH) return false
	const match = value.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/)
	const encoded = match?.[2]
	if (!encoded || encoded.length % 4 !== 0) return false

	const data = Buffer.from(encoded, 'base64')
	if (data.byteLength === 0 || data.byteLength > MAX_RASTER_BYTES) return false

	switch (match[1]) {
		case 'png':
			return data
				.subarray(0, 8)
				.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		case 'jpeg':
			return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
		case 'webp':
			return (
				data.subarray(0, 4).toString('ascii') === 'RIFF' &&
				data.subarray(8, 12).toString('ascii') === 'WEBP'
			)
		default:
			return false
	}
}

/** Draft HTML에서 렌더해도 되는 내부 에셋 또는 제한된 raster data URI인지 판정한다. */
export function isSafeDraftTemplateAssetUrl(value: string): boolean {
	return (
		isCanonicalAssetUrl(value, ['template-assets', ...AUTHORIZED_ASSET_COLLECTIONS]) ||
		isSafeRasterDataUrl(value)
	)
}

function allowedAttributes(tagName: string): Set<string> {
	const attributes = new Set(COMMON_ATTRIBUTES)
	if (tagName === 'div' || tagName === 'img') {
		for (const attribute of ASSET_ATTRIBUTES) attributes.add(attribute)
	}
	if (tagName === 'img') {
		for (const attribute of IMAGE_ATTRIBUTES) attributes.add(attribute)
	}
	return attributes
}

function metadataRef(
	tagName: string,
	attributes: Record<string, string>,
	styleUrls: string[],
	nodeId: string,
): AuthorizedImageRef | null | undefined {
	const collection = attributes['data-asset-collection']
	const rawId = attributes['data-asset-id']
	if (!collection && !rawId) return undefined
	if (!collection || !rawId || !isAuthorizedCollection(collection) || !/^\d+$/.test(rawId)) {
		return null
	}

	const assetId = Number(rawId)
	const uniqueStyleUrls = [...new Set(styleUrls)]
	const src = tagName === 'img' ? attributes.src : uniqueStyleUrls[0]
	if (!Number.isSafeInteger(assetId) || assetId <= 0 || !src) return null
	if (tagName !== 'img' && uniqueStyleUrls.length !== 1) return null

	return { collection, assetId, src, label: nodeId }
}

function sameRef(left: AuthorizedImageRef, right: AuthorizedImageRef): boolean {
	return (
		left.collection === right.collection &&
		left.assetId === right.assetId &&
		left.src === right.src
	)
}

function inspectFragment(
	html: string,
	mode: 'base' | 'draft' | 'public',
	expectedRefsByNode: ReadonlyMap<string, AuthorizedImageRef>,
): InspectedFragment {
	const result: InspectedFragment = { nodeIds: new Set(), refs: [] }
	let currentAttributes = new Set<string>()
	let duplicateAttribute = false

	const block = (message: string) => {
		result.blocker ??= message
	}

	try {
		const parser = new Parser(
			{
				onattribute(name) {
					if (currentAttributes.has(name)) duplicateAttribute = true
					currentAttributes.add(name)
				},
				oncomment() {
					block('HTML 주석은 템플릿에서 사용할 수 없습니다.')
				},
				onopentag(tagName, attributes) {
					if (result.blocker) return
					if (!ALLOWED_TAGS.has(tagName) || duplicateAttribute) {
						block('HTML에 허용하지 않는 태그 또는 중복 속성이 있습니다.')
						return
					}

					const allowed = allowedAttributes(tagName)
					if (Object.keys(attributes).some((name) => !allowed.has(name))) {
						block('HTML에 허용하지 않는 속성이 있습니다.')
						return
					}

					const nodeId = attributes['data-node-id']
					if (
						!nodeId ||
						nodeId.length > 200 ||
						!SAFE_NODE_ID.test(nodeId) ||
						result.nodeIds.has(nodeId)
					) {
						block('HTML data-node-id가 없거나 유일하고 안전한 형식이 아닙니다.')
						return
					}
					result.nodeIds.add(nodeId)

					const style = inspectStyle(attributes.style ?? '')
					if (style.blocker) {
						block(style.blocker)
						return
					}

					const src = attributes.src
					if (mode === 'base') {
						if (
							style.urls.length > 0 ||
							(src &&
								!isCanonicalAssetUrl(src, [
									'template-assets',
									...AUTHORIZED_ASSET_COLLECTIONS,
								]))
						) {
							block('baseHtml에는 내부 staging 에셋 외의 URL을 사용할 수 없습니다.')
						}
						const fromMetadata = metadataRef(tagName, attributes, style.urls, nodeId)
						if (fromMetadata === null) {
							block('baseHtml의 에셋 메타데이터가 올바르지 않습니다.')
						} else if (fromMetadata) {
							result.refs.push(fromMetadata)
						}
						return
					}
					if (mode === 'draft') {
						const fromMetadata = metadataRef(tagName, attributes, style.urls, nodeId)
						const usedUrls = [...(src ? [src] : []), ...style.urls]
						if (
							fromMetadata === null ||
							usedUrls.some((url) => !isSafeDraftTemplateAssetUrl(url))
						) {
							block(
								'Draft HTML에는 내부 에셋 또는 안전한 raster data URI만 사용할 수 있습니다.',
							)
						} else if (fromMetadata) {
							result.refs.push(fromMetadata)
						}
						return
					}

					const expected = expectedRefsByNode.get(nodeId)
					const fromMetadata = metadataRef(tagName, attributes, style.urls, nodeId)
					if (fromMetadata === null) {
						block('HTML의 에셋 메타데이터가 올바르지 않습니다.')
						return
					}
					if (expected && fromMetadata && !sameRef(expected, fromMetadata)) {
						block('HTML과 overrides의 에셋 참조가 일치하지 않습니다.')
						return
					}

					const ref = expected ?? fromMetadata
					const usedUrls = [...(src ? [src] : []), ...style.urls]
					if (
						usedUrls.length > 0 &&
						(!ref ||
							usedUrls.some(
								(url) =>
									url !== ref.src ||
									!isCanonicalAssetUrl(url, AUTHORIZED_ASSET_COLLECTIONS),
							))
					) {
						block('공개 HTML의 모든 URL은 인가 에셋 참조와 일치해야 합니다.')
						return
					}
					if ((tagName === 'img' || fromMetadata) && (!ref || usedUrls.length === 0)) {
						block('공개 HTML 이미지에는 인가 에셋 메타데이터가 필요합니다.')
						return
					}
					if (ref) result.refs.push(ref)
				},
				onopentagname() {
					currentAttributes = new Set()
					duplicateAttribute = false
				},
				onprocessinginstruction() {
					block('HTML 처리 지시문은 사용할 수 없습니다.')
				},
			},
			{ decodeEntities: true, lowerCaseAttributeNames: true, lowerCaseTags: true },
		)
		parser.end(html)
	} catch {
		block('HTML을 안전하게 해석할 수 없습니다.')
	}

	if (!result.blocker && result.nodeIds.size === 0) {
		block('HTML 템플릿에는 data-node-id가 있는 요소가 필요합니다.')
	}
	return result
}

/**
 * Figma HTML 모델의 구조와 URL 출처를 검사한다. 파서는 태그/속성을 실행하지 않고,
 * 공개 URL은 service가 전달한 구조화 에셋 참조와 정확히 일치할 때만 허용한다.
 */
export function inspectTemplateHtml(input: {
	baseHtml: string
	html: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedImageRef>
}): TemplateHtmlInspection {
	const base = inspectFragment(input.baseHtml, 'base', input.refsByNode)
	if (base.blocker) return { blocker: base.blocker, refs: [] }

	const published = inspectFragment(input.html, 'public', input.refsByNode)
	if (published.blocker) return { blocker: published.blocker, refs: [] }

	for (const nodeId of input.overrideNodeIds) {
		if (!base.nodeIds.has(nodeId) || !published.nodeIds.has(nodeId)) {
			return {
				blocker: `HTML overrides가 존재하지 않는 노드를 참조합니다: ${nodeId}`,
				refs: [],
			}
		}
	}

	return { refs: published.refs }
}

/** 안전성 검사를 통과한 baseHtml에서 Figma import가 직접 기록한 구조화 에셋 참조를 읽는다. */
export function inspectBaseTemplateHtml(html: string): TemplateHtmlInspection {
	const base = inspectFragment(html, 'base', new Map())
	return { blocker: base.blocker, refs: base.refs }
}

/** 안전한 draft HTML에서 실제 렌더 결과가 사용하는 구조화 에셋 참조를 읽는다. */
export function inspectDraftTemplateAssetRefs(html: string): TemplateHtmlInspection {
	const draft = inspectFragment(html, 'draft', new Map())
	return { blocker: draft.blocker, refs: draft.refs }
}

/** Draft 저장 시 실행 가능한 HTML과 외부 URL을 막되 staging 에셋은 허용한다. */
export function inspectDraftTemplateHtml(input: {
	baseHtml?: string
	html?: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedImageRef>
}): TemplateHtmlInspection {
	const base = input.baseHtml
		? inspectFragment(input.baseHtml, 'base', input.refsByNode)
		: undefined
	if (base?.blocker) return { blocker: base.blocker, refs: [] }

	const draft = input.html ? inspectFragment(input.html, 'draft', input.refsByNode) : undefined
	if (draft?.blocker) return { blocker: draft.blocker, refs: [] }

	const nodeIds = draft?.nodeIds ?? base?.nodeIds ?? new Set<string>()
	for (const nodeId of input.overrideNodeIds) {
		if (!nodeIds.has(nodeId)) {
			return {
				blocker: `HTML overrides가 존재하지 않는 노드를 참조합니다: ${nodeId}`,
				refs: [],
			}
		}
	}

	return { refs: [] }
}

/** 기존 published 문서를 렌더하기 직전 공개 HTML 구조를 다시 검사한다. */
export function inspectPublishedTemplateHtml(input: {
	html: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedImageRef>
}): TemplateHtmlInspection {
	const published = inspectFragment(input.html, 'public', input.refsByNode)
	if (published.blocker) return { blocker: published.blocker, refs: [] }

	for (const nodeId of input.overrideNodeIds) {
		if (!published.nodeIds.has(nodeId)) {
			return {
				blocker: `HTML overrides가 존재하지 않는 노드를 참조합니다: ${nodeId}`,
				refs: [],
			}
		}
	}

	return { refs: published.refs }
}
