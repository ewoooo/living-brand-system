import type { Payload } from 'payload'

interface PublishedGuidelineCheckQuery {
	locale?: 'en' | 'ko'
	overrideAccess: boolean
	user?: unknown
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
