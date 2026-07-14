import { type FieldHook, ValidationError } from 'payload'

/** Guideline Document slug가 같은 locale과 부모 아래에서만 고유하도록 검증한다. */
export const validateGuidelineDocumentSlug: FieldHook = async ({
	collection,
	data,
	originalDoc,
	req,
	value,
}) => {
	const slug = typeof value === 'string' ? value : originalDoc?.slug
	if (!slug) return value

	const parent = relationshipId(
		data && Object.hasOwn(data, 'parent') ? data.parent : originalDoc?.parent,
	)
	const currentId = relationshipId(originalDoc?.id)

	// ponytail: Admin의 저빈도 쓰기는 저장 전 조회로 충분하다. 동시 쓰기가 생기면 DB 경로 키를 추가한다.
	const duplicate = await req.payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		fallbackLocale: false,
		limit: 1,
		locale: req.locale,
		overrideAccess: true,
		pagination: false,
		req,
		where: {
			and: [
				{ slug: { equals: slug } },
				parent === null ? { parent: { exists: false } } : { parent: { equals: parent } },
				...(currentId === null ? [] : [{ id: { not_equals: currentId } }]),
			],
		},
	})

	if (duplicate.docs.length > 0) {
		throw new ValidationError({
			collection: collection?.slug,
			errors: [
				{ message: '같은 상위 문서 아래에서 이미 사용 중인 slug입니다.', path: 'slug' },
			],
			req,
		})
	}

	return value
}

function relationshipId(value: unknown): number | string | null {
	if (typeof value === 'number' || typeof value === 'string') return value
	if (typeof value === 'object' && value !== null && 'id' in value) {
		return relationshipId(value.id)
	}
	return null
}
