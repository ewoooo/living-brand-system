import { type CollectionBeforeValidateHook, ValidationError } from 'payload'
import { listGuidelineCheckContainers } from '../repositories/guideline-document.payload.repository'
import {
	collectCheckKeys,
	findDuplicateGuidelineCheckKey,
} from '../services/validate-guideline-check-keys.service'

/** Guideline 문서 저장 전에 전체 문서와 Block에서 Check key 중복을 막는다. */
export const validateGuidelineCheckKeys: CollectionBeforeValidateHook = async ({
	collection,
	data,
	originalDoc,
	req,
}) => {
	if (req.context?.skipGuidelineCheckUniqueness === true) return data

	const document = { ...originalDoc, ...data }
	let duplicate = findDuplicateGuidelineCheckKey(document, [], originalDoc?.id)
	if (!duplicate && collectCheckKeys(document).length > 0) {
		const savedDocuments = await listGuidelineCheckContainers(req)
		duplicate = findDuplicateGuidelineCheckKey(document, savedDocuments, originalDoc?.id)
	}

	if (duplicate) {
		throw new ValidationError({
			collection: collection.slug,
			errors: [{ message: `이미 사용 중인 Check key입니다: ${duplicate}`, path: 'checks' }],
			req,
		})
	}

	return data
}
