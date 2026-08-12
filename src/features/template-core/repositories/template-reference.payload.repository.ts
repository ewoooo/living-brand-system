import type { PayloadRequest } from 'payload'
import type { AuthorizedTemplateAssetCollection } from '@/features/template-core/domain/template-asset-policy'

export interface PublishedTemplateScanRow {
	id: number
	name?: unknown
	html?: unknown
	overrides?: unknown
}

/** 참조 무결성 검사에 필요한 published Template 부분집합을 Payload에서 읽는다. */
export async function listPublishedTemplates(
	req: PayloadRequest,
): Promise<PublishedTemplateScanRow[]> {
	const { docs } = await req.payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		limit: 0,
		overrideAccess: true,
		pagination: false,
		req,
		select: { name: true, html: true, overrides: true },
		where: { _status: { equals: 'published' } },
	})
	return docs
}

/** 삭제 대상 Template 에셋의 filename을 같은 Payload 요청 경계에서 읽는다. */
export async function findTemplateAssetFilename(
	req: PayloadRequest,
	collection: AuthorizedTemplateAssetCollection,
	id: number | string,
): Promise<unknown> {
	const doc = await req.payload.findByID({
		collection,
		id,
		depth: 0,
		disableErrors: true,
		overrideAccess: true,
		req,
		select: { filename: true },
	})
	return doc?.filename
}

/** Template category를 참조하는 현재 Template 행 수를 Payload에서 읽는다. */
export async function countTemplatesByCategory(
	req: PayloadRequest,
	categoryId: number,
): Promise<number> {
	const { totalDocs } = await req.payload.count({
		collection: 'templates',
		overrideAccess: true,
		req,
		where: { category: { equals: categoryId } },
	})
	return totalDocs
}
