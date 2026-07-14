import config from '@payload-config'
import { getPayload } from 'payload'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import { DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/** 검수 기준인 published 통합 Guideline 문서와 내부 Check source를 조회한다. */
export async function getCheckSourceDocuments() {
	const payload = await getPayload({ config })

	return findPublishedUnifiedGuidelineCheckDocuments(payload, {
		locale: LOCALE,
		overrideAccess: true,
	})
}
