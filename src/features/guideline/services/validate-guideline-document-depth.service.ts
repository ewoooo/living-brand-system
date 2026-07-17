const MAX_GUIDELINE_LEVELS = 3

/**
 * Guideline 저장 게이트 Use Case — 순환 부모 관계와 장·섹션·페이지 3단계를 넘는 배치를 판정한다.
 * 계층·breadcrumb 조회와 Payload 변환은 guideline-document.payload.repository가 소유하며 이 함수는 I/O가 없다.
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
		return '가이드라인 문서는 장·섹션·페이지 3단계까지만 만들 수 있습니다.'
	}

	return null
}

function getSubtreeLevels(descendantPaths: number[][], currentId: number) {
	return descendantPaths.reduce((maxLevels, path) => {
		const currentIndex = path.indexOf(currentId)
		return Math.max(maxLevels, currentIndex < 0 ? 1 : path.length - currentIndex)
	}, 1)
}
