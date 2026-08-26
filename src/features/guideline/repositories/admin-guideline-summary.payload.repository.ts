import config from '@payload-config'
import { getPayload } from 'payload'

/** Admin summary가 집계할 문서를 Payload 관계와 Block 구조에서 plain DTO로 변환한다. */
export async function listAdminGuidelineSummaryDocuments() {
	const payload = await getPayload({ config })
	const { docs: documents } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		pagination: false,
		select: { blocks: true, rules: true },
	})

	return documents.map((document) => ({
		ruleCount: [
			...(document.rules ?? []),
			...(document.blocks ?? []).flatMap((block) => block.rules ?? []),
		].length,
	}))
}
