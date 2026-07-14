import type { Payload } from 'payload'

interface PublishedGuidelineCheckQuery {
	locale?: 'en' | 'ko'
	overrideAccess: boolean
	user?: unknown
}

/** published Section/Page와 내부 Check·Block 관계를 한 번에 읽는다. */
export async function findPublishedGuidelineCheckDocuments(
	payload: Payload,
	{ locale = 'ko', overrideAccess, user }: PublishedGuidelineCheckQuery,
) {
	const query = {
		draft: false,
		fallbackLocale: 'en' as const,
		locale,
		overrideAccess,
		user: user as never,
		where: { _status: { equals: 'published' as const } },
	}
	const [sections, pages] = await Promise.all([
		payload.find({
			...query,
			collection: 'guideline-sections',
			depth: 1,
			limit: 500,
			sort: 'displayOrder',
		}),
		payload.find({
			...query,
			collection: 'guideline-pages',
			depth: 2,
			limit: 500,
			sort: 'displayOrder',
		}),
	])

	return { sections: sections.docs, pages: pages.docs }
}

/** published 통합 Guideline 문서와 내부 Check·Block 관계를 한 번에 읽는다. */
export async function findPublishedUnifiedGuidelineCheckDocuments(
	payload: Payload,
	{ locale = 'ko', overrideAccess, user }: PublishedGuidelineCheckQuery,
) {
	const documents = await payload.find({
		collection: 'guideline-documents',
		depth: 2,
		draft: false,
		fallbackLocale: 'en',
		limit: 2000,
		locale,
		overrideAccess,
		sort: 'displayOrder',
		user: user as never,
	})

	return { documents: documents.docs }
}
