import type { Payload } from 'payload'
import { getAdminGuidelineSummary } from '@/features/guideline/repositories/admin-guideline-summary.payload.repository'

export default async function DashboardSummary({ payload }: { payload: Payload }) {
	const { checks, sections, pages } = await getAdminGuidelineSummary(payload).catch(() => ({
		checks: 0,
		sections: 0,
		pages: 0,
	}))

	return (
		<section className="dashboard-summary">
			<h2>대시보드 요약</h2>
			<ul>
				<li>Check: {checks.toLocaleString('ko-KR')}</li>
				<li>섹션: {sections.toLocaleString('ko-KR')}</li>
				<li>페이지: {pages.toLocaleString('ko-KR')}</li>
			</ul>
		</section>
	)
}
