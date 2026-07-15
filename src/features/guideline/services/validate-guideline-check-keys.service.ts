import type { PayloadRequest } from 'payload'
import { checkKeyFromEnglishTitle } from '@/blocks/guideline'
import { listGuidelineCheckContainers } from '../repositories/guideline-document.payload.repository'

type CheckValue = {
	key?: unknown
	title?: unknown
}

export type CheckContainer = {
	blocks?: unknown
	checks?: unknown
}

/**
 * Guideline 저장 게이트 Use Case — 저장할 문서와 저장된 전체 문서에서 첫 번째 Check key 중복을 찾는다.
 * Payload 조회는 guideline-document.payload.repository가 소유하고, 훅이 결과를 ValidationError로 바꾼다.
 */
export async function findDuplicateGuidelineCheckKey(
	req: PayloadRequest,
	document: CheckContainer,
	originalDocId: number | string | null | undefined,
): Promise<string | null> {
	const currentKeys = collectCheckKeys(document)
	const duplicateInDocument = duplicateKey(currentKeys)

	if (duplicateInDocument) return duplicateInDocument
	if (currentKeys.length === 0) return null

	// ponytail: Admin 규모에서는 저장 전 전체 key 조회가 가장 작은 해법이다. 동시 쓰기 충돌이 실제 문제가 될 때만 registry table을 도입한다.
	const savedDocuments = await listGuidelineCheckContainers(req)

	for (const savedDocument of savedDocuments) {
		if (originalDocId != null && String(savedDocument.id) === String(originalDocId)) {
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
