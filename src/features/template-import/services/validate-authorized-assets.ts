import { jsonTemplateSchema } from '@/types/json-template'

/**
 * 저장하려는 jsonTemplate에서 인가되지 않은 이미지 요소를 찾는다.
 * 임포트 조각(template-assets)을 그대로 쓰는 요소가 하나라도 있으면 Templates 저장을 막는 근거가 된다.
 * 반환값은 사용자에게 보여줄 요소 라벨 목록이다.
 */
export function findUnauthorizedTemplateImages(jsonTemplate: unknown): string[] {
	const parsed = jsonTemplateSchema.safeParse(jsonTemplate)

	if (!parsed.success) {
		// 스키마가 깨진 값은 여기서 판단하지 않는다 — 읽기 계약이 별도로 걸러낸다.
		return []
	}

	return parsed.data.elements
		.filter(
			(element) => element.type === 'image' && element.assetCollection === 'template-assets',
		)
		.map((element) => element.slotLabel || element.id)
}
