import { type CollectionBeforeValidateHook, ValidationError } from 'payload'
import {
	findGuidelineDocumentDepthViolation,
	relationshipId,
} from '../services/validate-guideline-document-depth.service'

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

	const violation = await findGuidelineDocumentDepthViolation(req, collection, {
		parentId,
		currentId: relationshipId(originalDoc?.id ?? data?.id),
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
