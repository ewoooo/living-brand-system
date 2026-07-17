import { type FieldHook, ValidationError } from 'payload'
import { hasGuidelineDocumentSlugConflict } from '../services/validate-guideline-document-slug.service'
import { relationshipId } from '../utils/block-text'

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
	const duplicate = await hasGuidelineDocumentSlugConflict(req, {
		slug,
		parentId: parent,
		currentId,
	})

	if (duplicate) {
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
