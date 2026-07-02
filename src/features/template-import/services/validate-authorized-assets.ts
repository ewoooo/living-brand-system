import {
	type JsonFlowElement,
	type JsonTemplateElement,
	jsonTemplateSchema,
} from '@/types/json-template'

/**
 * 저장하려는 jsonTemplate에서 인가되지 않은 이미지 요소를 찾는다.
 * 스택 자식까지 재귀 탐색한다 — 중첩 이미지가 인가 검증을 우회하면 안 된다.
 * 임포트 조각(template-assets)을 그대로 쓰는 요소가 하나라도 있으면 Templates 저장을 막는 근거가 된다.
 * 반환값은 사용자에게 보여줄 요소 라벨 목록이다.
 */
export function findUnauthorizedTemplateImages(jsonTemplate: unknown): string[] {
	const parsed = jsonTemplateSchema.safeParse(jsonTemplate)

	if (!parsed.success) {
		// 스키마가 깨진 값은 여기서 판단하지 않는다 — 읽기 계약이 별도로 걸러낸다.
		return []
	}

	return collectUnauthorizedImageLabels(parsed.data.elements)
}

function collectUnauthorizedImageLabels(
	elements: readonly (JsonFlowElement | JsonTemplateElement)[],
): string[] {
	return elements.flatMap((element) => {
		if (element.type === 'stack') {
			return collectUnauthorizedImageLabels(element.children)
		}

		if (element.type === 'image' && element.assetCollection === 'template-assets') {
			return [element.slotLabel || element.id]
		}

		return []
	})
}
