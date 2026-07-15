import { getParents } from '@payloadcms/plugin-nested-docs'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

/** draft를 포함한 전체 Guideline 문서에서 Check 컨테이너(blocks·checks)만 읽는다. */
export async function listGuidelineCheckContainers(req: PayloadRequest) {
	const result = await req.payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		limit: 0,
		overrideAccess: !req.user,
		pagination: false,
		req,
		select: { blocks: true, checks: true },
		...(req.user ? { user: req.user } : {}),
	})

	return result.docs
}

/** 상위 문서 체인을 루트까지 읽는다. nested-docs plugin 조회는 이 파일이 소유한다. */
export async function listGuidelineDocumentParents(
	req: PayloadRequest,
	collection: SanitizedCollectionConfig,
	parentId: number | string,
) {
	return getParents(req, {}, collection, { parent: parentId })
}

/** currentId를 breadcrumbs로 포함하는 하위 문서들의 breadcrumbs를 읽는다. */
export async function listGuidelineDescendantBreadcrumbs(
	req: PayloadRequest,
	currentId: number | string,
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

	return descendants.docs
}
