import type { Payload } from 'payload'

export default async function DashboardSummary({ payload }: { payload: Payload }) {
	const [rules, sections, pages] = await Promise.all([
		payload.count({ collection: 'rules' }),
		payload.count({ collection: 'sections' }),
		payload.count({ collection: 'guideline-pages' }),
	])

	return (
		<section className="dashboard-summary">
			<h2>Dashboard Summary</h2>
			<ul>
				<li>Rules: {rules.totalDocs}</li>
				<li>Sections: {sections.totalDocs}</li>
				<li>Pages: {pages.totalDocs}</li>
			</ul>
		</section>
	)
}
