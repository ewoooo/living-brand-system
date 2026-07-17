import { type CollectionBeforeValidateHook, ValidationError } from 'payload'
import { findGuidelineCheckKeyConflict } from '../services/validate-guideline-check-keys.service'

/** Guideline 문서 저장 전에 전체 문서와 Block에서 Check key 중복을 막는다. */
export const validateGuidelineCheckKeys: CollectionBeforeValidateHook = async ({
	collection,
	data,
	originalDoc,
	req,
}) => {
	if (req.context?.skipGuidelineCheckUniqueness === true) return data

	const document = { ...originalDoc, ...data }
	const duplicate = await findGuidelineCheckKeyConflict(req, document, originalDoc?.id)

	if (duplicate) {
		throw new ValidationError({
			collection: collection.slug,
			errors: [{ message: `이미 사용 중인 Check key입니다: ${duplicate}`, path: 'checks' }],
			req,
		})
	}

	return data
}
