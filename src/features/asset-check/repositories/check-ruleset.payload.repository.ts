import config from '@payload-config'
import { getPayload } from 'payload'
import { findPublishedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import { DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/** 검수 기준인 published Section/Page와 내부 Check source를 조회한다. */
export async function getCheckSourceDocuments() {
	const payload = await getPayload({ config })

	return findPublishedGuidelineCheckDocuments(payload, {
		locale: LOCALE,
		overrideAccess: true,
	})
}
