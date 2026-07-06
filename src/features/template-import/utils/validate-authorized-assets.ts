import {
	type AUTHORIZED_ASSET_COLLECTIONS,
	type JsonFlowElement,
	type JsonTemplateElement,
	jsonTemplateSchema,
} from '@/types/json-template'

/** "template-assets = 비인가(임포트 스테이징)" 판정 규칙 — 저장 게이트와 미리보기 표시가 함께 쓴다. */
export function isUnauthorizedAssetCollection(
	collection: (typeof AUTHORIZED_ASSET_COLLECTIONS)[number] | 'template-assets',
): collection is 'template-assets' {
	return collection === 'template-assets'
}

export interface AuthorizedImageRef {
	collection: (typeof AUTHORIZED_ASSET_COLLECTIONS)[number]
	assetId: number
	src: string
	label: string
}

export interface TemplateImageValidation {
	/** empty: jsonTemplate 없음(허용), invalid: 스키마 불일치(저장 거부 — fail-closed), ok: 검사 결과 사용 */
	status: 'empty' | 'invalid' | 'ok'
	/** 임포트 조각(template-assets)을 그대로 쓰는 요소의 라벨 — 하나라도 있으면 저장을 막는다. */
	unauthorizedLabels: string[]
	/** 인가 컬렉션을 자기신고한 이미지 참조 — 호출자(hook)가 실제 문서 존재·src 일치를 검증한다. */
	authorizedRefs: AuthorizedImageRef[]
}

/**
 * 저장하려는 jsonTemplate의 이미지 인가 상태를 판정한다.
 * 스택 자식까지 재귀 탐색한다 — 중첩 이미지가 인가 검증을 우회하면 안 된다.
 * 스키마가 깨진 값은 fail-closed(invalid)로 보고해 보안 게이트가 열린 채 지나가지 않게 한다.
 */
export function validateTemplateImages(jsonTemplate: unknown): TemplateImageValidation {
	if (jsonTemplate == null) {
		return { status: 'empty', unauthorizedLabels: [], authorizedRefs: [] }
	}

	const parsed = jsonTemplateSchema.safeParse(jsonTemplate)

	if (!parsed.success) {
		return { status: 'invalid', unauthorizedLabels: [], authorizedRefs: [] }
	}

	const unauthorizedLabels: string[] = []
	const authorizedRefs: AuthorizedImageRef[] = []

	const walk = (elements: readonly (JsonFlowElement | JsonTemplateElement)[]) => {
		for (const element of elements) {
			if (element.type === 'stack') {
				walk(element.children)
				continue
			}
			if (element.type !== 'image') {
				continue
			}

			if (isUnauthorizedAssetCollection(element.assetCollection)) {
				unauthorizedLabels.push(element.slotLabel || element.id)
			} else {
				authorizedRefs.push({
					collection: element.assetCollection,
					assetId: element.assetId,
					src: element.src,
					label: element.slotLabel || element.id,
				})
			}
		}
	}

	walk(parsed.data.elements)

	return { status: 'ok', unauthorizedLabels, authorizedRefs }
}
