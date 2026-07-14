import { type CollectionBeforeValidateHook, ValidationError } from 'payload'
import { checkKeyFromEnglishTitle } from '@/blocks/guideline'

type CheckValue = {
	key?: unknown
	title?: unknown
}

type CheckContainer = {
	blocks?: unknown
	checks?: unknown
}

const GUIDELINE_COLLECTIONS = ['guideline-sections', 'guideline-pages'] as const

/** Guideline 문서 저장 전에 Section/Page/Block 전체에서 Check key 중복을 막는다. */
export const validateGuidelineCheckKeys: CollectionBeforeValidateHook = async ({
	collection,
	data,
	originalDoc,
	req,
}) => {
	const document = { ...originalDoc, ...data }
	const currentKeys = collectCheckKeys(document)
	const duplicateInDocument = duplicateKey(currentKeys)

	if (duplicateInDocument) {
		throw duplicateKeyError(duplicateInDocument, collection.slug, req)
	}
	if (currentKeys.length === 0) return data

	// ponytail: Admin 규모에서는 저장 전 전체 key 조회가 가장 작은 해법이다. 동시 쓰기 충돌이 실제 문제가 될 때만 registry table을 도입한다.
	for (const collectionSlug of GUIDELINE_COLLECTIONS) {
		const result = await req.payload.find({
			collection: collectionSlug,
			depth: 0,
			draft: true,
			limit: 0,
			overrideAccess: !req.user,
			pagination: false,
			req,
			select: { blocks: true, checks: true },
			...(req.user ? { user: req.user } : {}),
		})

		for (const savedDocument of result.docs) {
			if (
				collectionSlug === collection.slug &&
				originalDoc?.id != null &&
				String(savedDocument.id) === String(originalDoc.id)
			) {
				continue
			}

			const savedKeys = new Set(collectCheckKeys(savedDocument))
			const duplicate = currentKeys.find((key) => savedKeys.has(key))
			if (duplicate) throw duplicateKeyError(duplicate, collection.slug, req)
		}
	}

	return data
}

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

function duplicateKeyError(
	key: string,
	collection: string,
	req: Parameters<CollectionBeforeValidateHook>[0]['req'],
) {
	return new ValidationError({
		collection,
		errors: [{ message: `이미 사용 중인 Check key입니다: ${key}`, path: 'checks' }],
		req,
	})
}
