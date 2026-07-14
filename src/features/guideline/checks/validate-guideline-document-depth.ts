import { getParents } from '@payloadcms/plugin-nested-docs'
import { type CollectionBeforeValidateHook, ValidationError } from 'payload'

const MAX_GUIDELINE_LEVELS = 3

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
	if (currentId !== null && String(parentId) === String(currentId)) {
		throw parentError('자기 자신을 상위 문서로 지정할 수 없습니다.', collection.slug, req)
	}

	const parents = await getParents(req, {}, collection, { parent: parentId })
	if (currentId !== null && parents.some(({ id }) => String(id) === String(currentId))) {
		throw parentError('하위 문서를 상위 문서로 지정할 수 없습니다.', collection.slug, req)
	}

	const subtreeLevels = currentId === null ? 1 : await getSubtreeLevels(currentId, req)
	if (parents.length + subtreeLevels > MAX_GUIDELINE_LEVELS) {
		throw parentError(
			'가이드라인 문서는 장·섹션·페이지 3단계까지만 만들 수 있습니다.',
			collection.slug,
			req,
		)
	}

	return data
}

async function getSubtreeLevels(
	currentId: number | string,
	req: Parameters<CollectionBeforeValidateHook>[0]['req'],
) {
	const descendants = await req.payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		limit: 0,
		pagination: false,
		req,
		select: { breadcrumbs: true },
		where: { 'breadcrumbs.doc': { equals: currentId } },
	})

	return descendants.docs.reduce((maxLevels, descendant) => {
		const breadcrumbs = Array.isArray(descendant.breadcrumbs) ? descendant.breadcrumbs : []
		const currentIndex = breadcrumbs.findIndex(
			(breadcrumb) => String(relationshipId(breadcrumb.doc)) === String(currentId),
		)
		return Math.max(maxLevels, currentIndex < 0 ? 1 : breadcrumbs.length - currentIndex)
	}, 1)
}

function relationshipId(value: unknown): number | string | null {
	if (typeof value === 'number' || typeof value === 'string') return value
	if (typeof value === 'object' && value !== null && 'id' in value) {
		return relationshipId(value.id)
	}
	return null
}

function parentError(
	message: string,
	collection: string,
	req: Parameters<CollectionBeforeValidateHook>[0]['req'],
) {
	return new ValidationError({
		collection,
		errors: [{ message, path: 'parent' }],
		req,
	})
}
