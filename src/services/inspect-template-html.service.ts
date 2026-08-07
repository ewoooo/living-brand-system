import { Parser } from 'htmlparser2'
import { inspectTemplateStyle } from '@/services/inspect-template-style.service'
import {
	AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
	type AuthorizedTemplateImageRef,
	isAuthorizedTemplateAssetCollection,
	isCanonicalTemplateAssetUrl,
	isSafeDraftTemplateAssetUrl,
	sameRef,
} from '@/services/template-asset-policy.service'

const ALLOWED_TAGS = new Set(['div', 'img', 'p'])
const COMMON_ATTRIBUTES = new Set(['data-figma-type', 'data-name', 'data-node-id', 'style'])
const ASSET_ATTRIBUTES = new Set(['data-asset-collection', 'data-asset-id'])
const IMAGE_ATTRIBUTES = new Set(['alt', 'src'])
const SAFE_NODE_ID = /^[a-zA-Z0-9:;_-]+$/

export interface TemplateFragmentInspection {
	blocker?: string
	nodeIds: ReadonlySet<string>
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

/**
 * HTML fragment 하나를 mode 규칙으로 1회 파싱해 blocker·노드 id 집합·에셋 참조를 읽는다.
 * base=내부 staging 에셋만, draft=내부 에셋+안전한 raster data URI,
 * public=모든 URL이 인가 에셋 참조(refsByNode의 기대 참조 포함)와 일치해야 한다.
 * ⚠️ 같은 html이라도 mode가 다르면 refs 집합이 다르다 — 같은 mode끼리만 결과를 재사용할 것.
 * refsByNode는 public mode에서만 쓰인다. 외부 I/O 없음 — 조회·저장은 호출 Use Case가 소유한다.
 */
export function inspectTemplateFragment(
	html: string,
	mode: 'base' | 'draft' | 'public',
	refsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef> = new Map(),
): TemplateFragmentInspection {
	const result: { blocker?: string; nodeIds: Set<string>; refs: AuthorizedTemplateImageRef[] } = {
		nodeIds: new Set(),
		refs: [],
	}
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

					// compose가 에셋 참조를 캐리어/오버레이 요소로 옮기므로 프레임 키의 기대 참조는
					// 이 대조에서 비활성(요소가 안 맞아 걸리지 않는다) — 실질 보장은
					// findInvalidAuthorizedRefs(모든 URL의 published 대조)가 진다.
					const expected = refsByNode.get(nodeId)
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

/**
 * overrides가 참조하는 노드가 주어진 모든 fragment 노드 집합에 존재하는지 검사한다.
 * 파싱·외부 I/O 없음 — fragment는 호출자가 inspectTemplateFragment로 만든다.
 */
export function findMissingOverrideNodeBlocker(
	overrideNodeIds: readonly string[],
	nodeIdSets: readonly ReadonlySet<string>[],
): string | null {
	for (const nodeId of overrideNodeIds) {
		if (nodeIdSets.some((nodeIds) => !nodeIds.has(nodeId))) {
			return `HTML overrides가 존재하지 않는 노드를 참조합니다: ${nodeId}`
		}
	}
	return null
}
