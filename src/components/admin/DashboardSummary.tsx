import type { Payload } from 'payload'

export default async function DashboardSummary({ payload }: { payload: Payload }) {
	const countDocs = (collection: 'rules' | 'sections' | 'guideline-pages') =>
		payload
			.count({ collection })
			.then((result) => result.totalDocs)
			.catch(() => 0)

	const [rules, sections, pages] = await Promise.all([
		countDocs('rules'),
		countDocs('sections'),
		countDocs('guideline-pages'),
	])

	return (
		<section className="dashboard-summary">
			<h2>대시보드 요약</h2>
			<ul>
				<li>규칙: {rules.toLocaleString('ko-KR')}</li>
				<li>섹션: {sections.toLocaleString('ko-KR')}</li>
				<li>페이지: {pages.toLocaleString('ko-KR')}</li>
			</ul>
		</section>
	)
}
