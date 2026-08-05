import { Parser } from 'htmlparser2'
import { inspectTemplateStyle } from '@/services/inspect-template-style.service'
import {
	AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
	type AuthorizedTemplateImageRef,
	isAuthorizedTemplateAssetCollection,
	isCanonicalTemplateAssetUrl,
	isSafeDraftTemplateAssetUrl,
} from '@/services/template-asset-policy.service'

const ALLOWED_TAGS = new Set(['div', 'img', 'p'])
const COMMON_ATTRIBUTES = new Set(['data-figma-type', 'data-name', 'data-node-id', 'style'])
const ASSET_ATTRIBUTES = new Set(['data-asset-collection', 'data-asset-id'])
const IMAGE_ATTRIBUTES = new Set(['alt', 'src'])
const SAFE_NODE_ID = /^[a-zA-Z0-9:;_-]+$/

interface InspectedFragment {
	blocker?: string
	nodeIds: Set<string>
	refs: AuthorizedTemplateImageRef[]
}

export interface TemplateHtmlInspection {
	blocker?: string
	refs: AuthorizedTemplateImageRef[]
}

function allowedAttributes(tagName: string): Set<string> {
	const attributes = new Set(COMMON_ATTRIBUTES)
	if (tagName === 'div' || tagName === 'img') {
		for (const attribute of ASSET_ATTRIBUTES) attributes.add(attribute)
		// import가 이미지 슬롯 캐리어로 표시하는 마커 — compose의 생성 이미지 교체 대상.
		attributes.add('data-image-carrier')
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
): AuthorizedTemplateImageRef | null | undefined {
	const collection = attributes['data-asset-collection']
	const rawId = attributes['data-asset-id']
	if (!collection && !rawId) return undefined
	if (
		!collection ||
		!rawId ||
		!isAuthorizedTemplateAssetCollection(collection) ||
		!/^\d+$/.test(rawId)
	) {
		return null
	}

	const assetId = Number(rawId)
	const uniqueStyleUrls = [...new Set(styleUrls)]
	const src = tagName === 'img' ? attributes.src : uniqueStyleUrls[0]
	if (!Number.isSafeInteger(assetId) || assetId <= 0 || !src) return null
	if (tagName !== 'img' && uniqueStyleUrls.length !== 1) return null

	return { collection, assetId, src, label: nodeId }
}

function sameRef(left: AuthorizedTemplateImageRef, right: AuthorizedTemplateImageRef): boolean {
	return (
		left.collection === right.collection &&
		left.assetId === right.assetId &&
		left.src === right.src
	)
}

function inspectFragment(
	html: string,
	mode: 'base' | 'draft' | 'public',
	expectedRefsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef>,
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

					const style = inspectTemplateStyle(attributes.style ?? '')
					if (style.blocker) {
						block(style.blocker)
						return
					}

					const src = attributes.src
					if (mode === 'base') {
						// style url은 import가 IMAGE fill을 background-image로 낮출 때만 생긴다 — src와 같은 내부 출처 규칙을 적용한다.
						const baseCollections = [
							'template-assets' as const,
							...AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
						]
						if (
							style.urls.some(
								(url) => !isCanonicalTemplateAssetUrl(url, baseCollections),
							) ||
							(src && !isCanonicalTemplateAssetUrl(src, baseCollections))
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
									!isCanonicalTemplateAssetUrl(
										url,
										AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
									),
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

/** Figma HTML 모델의 구조와 URL 출처를 검사한다. */
export function inspectTemplateHtml(input: {
	baseHtml: string
	html: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef>
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

/** 안전성 검사를 통과한 baseHtml에서 Figma import 에셋 참조를 읽는다. */
export function inspectBaseTemplateHtml(html: string): TemplateHtmlInspection {
	const base = inspectFragment(html, 'base', new Map())
	return { blocker: base.blocker, refs: base.refs }
}

/** 안전한 draft HTML에서 실제 렌더 결과가 사용하는 에셋 참조를 읽는다. */
export function inspectDraftTemplateAssetRefs(html: string): TemplateHtmlInspection {
	const draft = inspectFragment(html, 'draft', new Map())
	return { blocker: draft.blocker, refs: draft.refs }
}

/** Draft 저장 시 실행 가능한 HTML과 외부 URL을 막되 staging 에셋은 허용한다. */
export function inspectDraftTemplateHtml(input: {
	baseHtml?: string
	html?: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef>
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
	refsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef>
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
