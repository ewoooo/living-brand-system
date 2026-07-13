import config from '@payload-config'
import { getPayload } from 'payload'

/** Admin 대시보드용 Section/Page/임베디드 Check 수를 현재 문서 기준으로 집계한다. */
export async function findAdminGuidelineSummary() {
	const payload = await getPayload({ config })
	const [sections, pages] = await Promise.all([
		payload.find({
			collection: 'guideline-sections',
			depth: 0,
			draft: true,
			limit: 1000,
			select: { blocks: true, checks: true },
		}),
		payload.find({
			collection: 'guideline-pages',
			depth: 0,
			draft: true,
			limit: 1000,
			select: { blocks: true, checks: true },
		}),
	])
	const documents = [...sections.docs, ...pages.docs]
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

	return { checks, sections: sections.totalDocs, pages: pages.totalDocs }
}
