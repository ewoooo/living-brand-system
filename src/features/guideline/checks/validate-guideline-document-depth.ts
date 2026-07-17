import { type CollectionBeforeValidateHook, ValidationError } from 'payload'
import { getGuidelineDocumentDepthViolation } from '../services/validate-guideline-document-depth.service'
import { relationshipId } from '../utils/block-text'

/** Guideline Document의 순환 부모 관계와 장·섹션·페이지보다 깊은 계층을 막는다. */
export const validateGuidelineDocumentDepth: CollectionBeforeValidateHook = async ({
	collection,
	data,
	originalDoc,
	req,
}) => {
	const parentValue = data && Object.hasOwn(data, 'parent') ? data.parent : originalDoc?.parent
	const parentId = relationshipId(parentValue)
	if (parentId === null) return data

	const currentId = relationshipId(originalDoc?.id ?? data?.id)
	const violation = await getGuidelineDocumentDepthViolation({
		collection,
		currentId,
		parentId,
		req,
	})

	if (violation) {
		throw new ValidationError({
			collection: collection.slug,
			errors: [{ message: violation, path: 'parent' }],
			req,
		})
	}

	return data
}
