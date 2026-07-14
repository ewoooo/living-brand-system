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
