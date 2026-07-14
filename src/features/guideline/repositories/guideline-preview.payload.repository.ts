import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/lib/locale'
import type { User } from '@/payload-types'

export async function findDraftGuidelineDocumentById(documentId: number, user: User) {
	const payload = await getPayload({ config })

	return payload.findByID({
		collection: 'guideline-documents',
		id: documentId,
		depth: 2,
		draft: true,
		fallbackLocale: FALLBACK_LOCALE,
		locale: DEFAULT_LOCALE,
		overrideAccess: false,
		user,
	})
}

export async function listDraftGuidelineChildren(parentId: number, user: User) {
	const payload = await getPayload({ config })

	const children = await payload.find({
		collection: 'guideline-documents',
		depth: 2,
		draft: true,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 100,
		locale: DEFAULT_LOCALE,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
		where: { parent: { equals: parentId } },
	})

	return children.docs
}
