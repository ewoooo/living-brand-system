import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'
import {
	listGuidelineDocumentAncestorIds,
	listGuidelineDocumentDescendantPaths,
} from '../repositories/guideline-document.payload.repository'

const MAX_GUIDELINE_LEVELS = 2

/**
 * Guideline 저장 전에 부모 변경의 순환·최대 깊이 위반을 조회하고 판정한다.
 * 계층과 breadcrumb 조회·Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function getGuidelineDocumentDepthViolation({
	collection,
	currentId,
	parentId,
	req,
}: {
	collection: SanitizedCollectionConfig
	currentId: number | null
	parentId: number
	req: PayloadRequest
}) {
	const immediateViolation = findGuidelineDocumentDepthViolation({
		ancestorIds: [],
		parentId,
		currentId,
		descendantPaths: [],
	})
	if (immediateViolation) return immediateViolation

	const ancestorIds = await listGuidelineDocumentAncestorIds(req, collection, parentId)
	const descendantPaths =
		currentId === null ? [] : await listGuidelineDocumentDescendantPaths(req, currentId)

	return findGuidelineDocumentDepthViolation({
		ancestorIds,
		parentId,
		currentId,
		descendantPaths,
	})
}

/**
 * 순환 부모 관계와 챕터·토픽 2단계를 넘는 배치를 판정하는 순수 규칙이다.
 * 외부 I/O는 없으며 호출자가 계층 경로를 제공한다.
 */
export function findGuidelineDocumentDepthViolation({
	ancestorIds,
	currentId,
	descendantPaths,
	parentId,
}: {
	ancestorIds: number[]
	currentId: number | null
	descendantPaths: number[][]
	parentId: number
}): string | null {
	if (currentId !== null && parentId === currentId) {
		return '자기 자신을 상위 문서로 지정할 수 없습니다.'
	}

	if (currentId !== null && ancestorIds.includes(currentId)) {
		return '하위 문서를 상위 문서로 지정할 수 없습니다.'
	}

	const subtreeLevels = currentId === null ? 1 : getSubtreeLevels(descendantPaths, currentId)
	if (ancestorIds.length + subtreeLevels > MAX_GUIDELINE_LEVELS) {
		return '가이드라인 문서는 챕터·토픽 2단계까지만 만들 수 있습니다.'
	}

	return null
}

function getSubtreeLevels(descendantPaths: number[][], currentId: number) {
	return descendantPaths.reduce((maxLevels, path) => {
		const currentIndex = path.indexOf(currentId)
		return Math.max(maxLevels, currentIndex < 0 ? 1 : path.length - currentIndex)
	}, 1)
}
