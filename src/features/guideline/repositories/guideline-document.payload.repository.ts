import { getParents } from '@payloadcms/plugin-nested-docs'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'
import { relationshipId } from '@/features/guideline/utils/block-text'

/** Admin 문서 트리에 필요한 draft 문서 필드만 읽고 관계 값을 ID로 정규화한다. */
export async function listEditableGuidelineDocuments(
	payload: PayloadRequest['payload'],
	{
		locale,
		user,
	}: {
		locale?: 'en' | 'ko'
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
) {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		limit: 0,
		locale,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
	})

	return docs.map((document) => ({
		id: document.id,
		title: document.title,
		parent: relationshipId(document.parent),
		displayOrder: document.displayOrder,
		_status: document._status,
	}))
}

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

	return result.docs.map(({ id, blocks, checks }) => ({ id, blocks, checks }))
}

/** 상위 문서 체인을 루트까지 읽고 ID 목록으로 변환한다. */
export async function listGuidelineDocumentAncestorIds(
	req: PayloadRequest,
	collection: SanitizedCollectionConfig,
	parentId: number,
) {
	const parents = await getParents(req, {}, collection, { parent: parentId })

	return parents.map((parent) => relationshipId(parent) ?? -1)
}

/** currentId를 포함하는 하위 문서 breadcrumb를 ID 경로로 변환한다. */
export async function listGuidelineDocumentDescendantPaths(req: PayloadRequest, currentId: number) {
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

	return descendants.docs.map(({ breadcrumbs }) =>
		Array.isArray(breadcrumbs) ? breadcrumbs.map(({ doc }) => relationshipId(doc) ?? -1) : [],
	)
}

/** 같은 locale·부모 아래에 slug가 이미 있는지 조회한다. */
export async function hasGuidelineDocumentSlugConflict(
	req: PayloadRequest,
	{
		currentId,
		parentId,
		slug,
	}: {
		currentId: number | null
		parentId: number | null
		slug: string
	},
) {
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
				parentId === null
					? { parent: { exists: false } }
					: { parent: { equals: parentId } },
				...(currentId === null ? [] : [{ id: { not_equals: currentId } }]),
			],
		},
	})

	return duplicate.docs.length > 0
}

/** Guideline Check hook에 필요한 Checker 식별자와 실행 방식만 읽는다. */
export async function getGuidelineRuleCheckerSummary(req: PayloadRequest, checkerId: number) {
	const checker = await req.payload.findByID({
		collection: 'rule-checkers',
		id: checkerId,
		depth: 0,
		draft: true,
		overrideAccess: !req.user,
		req,
		...(req.user ? { user: req.user } : {}),
	})

	return { checkerKey: checker.checkerKey, executor: checker.executor }
}
