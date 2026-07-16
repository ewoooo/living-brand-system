import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'
import {
	listGuidelineDescendantBreadcrumbs,
	listGuidelineDocumentParents,
} from '../repositories/guideline-document.payload.repository'

const MAX_GUIDELINE_LEVELS = 3

/**
 * Guideline 저장 게이트 Use Case — 순환 부모 관계와 장·섹션·페이지 3단계를 넘는 배치를 판정해
 * 위반 메시지를 돌려준다. Payload·nested-docs 조회는 guideline-document.payload.repository가
 * 소유하고, 훅이 결과를 ValidationError로 바꾼다.
 */
export async function findGuidelineDocumentDepthViolation(
	req: PayloadRequest,
	collection: SanitizedCollectionConfig,
	{ parentId, currentId }: { parentId: number | string; currentId: number | string | null },
): Promise<string | null> {
	if (currentId !== null && String(parentId) === String(currentId)) {
		return '자기 자신을 상위 문서로 지정할 수 없습니다.'
	}

	const parents = await listGuidelineDocumentParents(req, collection, parentId)
	if (currentId !== null && parents.some(({ id }) => String(id) === String(currentId))) {
		return '하위 문서를 상위 문서로 지정할 수 없습니다.'
	}

	const subtreeLevels = currentId === null ? 1 : await getSubtreeLevels(req, currentId)
	if (parents.length + subtreeLevels > MAX_GUIDELINE_LEVELS) {
		return '가이드라인 문서는 장·섹션·페이지 3단계까지만 만들 수 있습니다.'
	}

	return null
}

async function getSubtreeLevels(req: PayloadRequest, currentId: number | string) {
	const descendants = await listGuidelineDescendantBreadcrumbs(req, currentId)

	return descendants.reduce((maxLevels, descendant) => {
		const breadcrumbs = Array.isArray(descendant.breadcrumbs) ? descendant.breadcrumbs : []
		const currentIndex = breadcrumbs.findIndex(
			(breadcrumb) => String(resolveRelationshipId(breadcrumb.doc)) === String(currentId),
		)
		return Math.max(maxLevels, currentIndex < 0 ? 1 : breadcrumbs.length - currentIndex)
	}, 1)
}

/**
 * Payload relationship 값(id 또는 populated 객체)에서 id를 꺼내는 순수 함수.
 * depth 검증 훅 어댑터가 hook 입력을 Service Input으로 바꿀 때 함께 쓴다. 외부 I/O 없음.
 */
export function resolveRelationshipId(value: unknown): number | string | null {
	if (typeof value === 'number' || typeof value === 'string') return value
	if (typeof value === 'object' && value !== null && 'id' in value) {
		return resolveRelationshipId(value.id)
	}
	return null
}
