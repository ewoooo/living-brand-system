import config from '@payload-config'
import { getPayload } from 'payload'

/** Admin 대시보드용 문서 깊이와 임베디드 Check 수를 현재 문서 기준으로 집계한다. */
export async function findAdminGuidelineSummary() {
	const payload = await getPayload({ config })
	const { docs: documents } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		pagination: false,
		select: { blocks: true, breadcrumbs: true, checks: true },
	})
	const checks = documents.reduce(
		(total, document) =>
			total +
			(document.checks?.length ?? 0) +
			(document.blocks ?? []).reduce(
				(count, block) => count + (block.checks?.length ?? 0),
				0,
			),
		0,
	)
	const atDepth = (depth: number) =>
		documents.filter((document) => document.breadcrumbs?.length === depth).length

	return { checks, chapters: atDepth(1), sections: atDepth(2), pages: atDepth(3) }
}
