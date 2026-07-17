import type { PayloadRequest } from 'payload'
import { checkKeyFromEnglishTitle } from '../checks/check-key-from-english-title'
import { listGuidelineCheckContainers } from '../repositories/guideline-document.payload.repository'

type CheckValue = {
	key?: unknown
	title?: unknown
}

export type CheckContainer = {
	blocks?: unknown
	checks?: unknown
}

type SavedCheckContainer = CheckContainer & { id: number }

/**
 * Guideline 저장 전에 현재 문서와 저장 문서 사이의 첫 Check key 충돌을 찾는다.
 * 저장 문서 조회와 Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function findGuidelineCheckKeyConflict(
	req: PayloadRequest,
	document: CheckContainer,
	originalDocId: number | null | undefined,
) {
	const duplicate = findDuplicateGuidelineCheckKey(document, [], originalDocId)
	if (duplicate || collectCheckKeys(document).length === 0) return duplicate

	return findDuplicateGuidelineCheckKey(
		document,
		await listGuidelineCheckContainers(req),
		originalDocId,
	)
}

/**
 * 저장할 문서와 이미 읽은 문서에서 첫 Check key 중복을 찾는 순수 규칙이다.
 * 외부 I/O는 없으며 호출자가 저장 문서를 제공한다.
 */
export function findDuplicateGuidelineCheckKey(
	document: CheckContainer,
	savedDocuments: SavedCheckContainer[],
	originalDocId: number | null | undefined,
): string | null {
	const currentKeys = collectCheckKeys(document)
	const duplicateInDocument = duplicateKey(currentKeys)

	if (duplicateInDocument) return duplicateInDocument
	if (currentKeys.length === 0) return null

	for (const savedDocument of savedDocuments) {
		if (originalDocId != null && savedDocument.id === originalDocId) {
			continue
		}

		const savedKeys = new Set(collectCheckKeys(savedDocument))
		const duplicate = currentKeys.find((key) => savedKeys.has(key))
		if (duplicate) return duplicate
	}

	return null
}

/**
 * 문서·블록 트리에서 check key를 전부 모으는 순수 함수. 외부 I/O 없음.
 * 중복 key 판정과 단위 테스트가 같은 수집 규칙을 쓰도록 export한다.
 */
export function collectCheckKeys(value: CheckContainer): string[] {
	const checks = Array.isArray(value.checks) ? (value.checks as CheckValue[]) : []
	const blockChecks = Array.isArray(value.blocks)
		? value.blocks.flatMap((block) =>
				typeof block === 'object' && block !== null
					? collectCheckKeys(block as CheckContainer)
					: [],
			)
		: []

	return [
		...checks.flatMap((check) => {
			const key =
				typeof check.key === 'string' && check.key.trim()
					? check.key.trim()
					: checkKeyFromEnglishTitle(check.title)
			return key ? [key] : []
		}),
		...blockChecks,
	]
}

function duplicateKey(keys: string[]): string | undefined {
	const unique = new Set<string>()
	return keys.find((key) => (unique.has(key) ? true : !unique.add(key)))
}
