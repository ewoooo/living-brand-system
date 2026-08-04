import config from '@payload-config'
import { getPayload } from 'payload'
import {
	collectGuidelineCheckSources,
	type GuidelineCheckSource,
} from '@/features/guideline/checks/collect-guideline-check-sources'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import { relationshipId } from '@/features/quality-rule/relationship-id'
import { DEFAULT_LOCALE as LOCALE } from '@/lib/locale'
import type { GuidelineDocument } from '@/payload-types'

export interface CheckRulesetSourceDocument {
	id: number
	title: string
	slug: string
	displayOrder: number
	breadcrumbDocumentIds: number[]
	checks: GuidelineCheckSource[]
}

/** 검수 기준인 published 통합 Guideline 문서와 내부 Check source를 조회한다. */
export async function getCheckSourceDocuments(): Promise<{
	documents: CheckRulesetSourceDocument[]
}> {
	const payload = await getPayload({ config })
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(payload, {
		locale: LOCALE,
		overrideAccess: true,
	})

	return { documents: documents.map(toCheckRulesetSourceDocument) }
}

function toCheckRulesetSourceDocument(document: GuidelineDocument): CheckRulesetSourceDocument {
	return {
		id: document.id,
		title: document.title,
		slug: document.slug,
		displayOrder: document.displayOrder,
		breadcrumbDocumentIds: (document.breadcrumbs ?? []).map(
			({ doc }) => relationshipId(doc) ?? -1,
		),
		checks: collectGuidelineCheckSources(document),
	}
}
