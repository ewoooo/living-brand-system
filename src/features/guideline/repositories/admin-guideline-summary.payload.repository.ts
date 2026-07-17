import config from '@payload-config'
import { getPayload } from 'payload'
import { relationshipId } from '@/features/guideline/utils/block-text'

/** Admin summary가 집계할 문서를 Payload 관계와 Block 구조에서 plain DTO로 변환한다. */
export async function listAdminGuidelineSummaryDocuments() {
	const payload = await getPayload({ config })
	const { docs: documents } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		pagination: false,
		select: { blocks: true, breadcrumbs: true, checks: true },
	})

	return documents.map((document) => ({
		breadcrumbDocumentIds: (document.breadcrumbs ?? []).map(
			({ doc }) => relationshipId(doc) ?? -1,
		),
		checkKeys: [
			...(document.checks ?? []),
			...(document.blocks ?? []).flatMap((block) => block.checks ?? []),
		].map(({ key }) => key),
	}))
}
