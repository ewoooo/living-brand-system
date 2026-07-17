import { Badge } from '@/components/ui/badge'
import { getAdminGuidelineSummary } from '@/features/guideline/services/get-admin-guideline-summary.service'

export default async function DashboardSummary() {
	const { checks, chapters, sections, pages } = await getAdminGuidelineSummary()

	return (
		<section className="dashboard-summary">
			<h2>대시보드 요약</h2>
			<ul>
				<li>
					<Badge variant="outline">Check: {checks.toLocaleString('ko-KR')}</Badge>
				</li>
				<li>
					<Badge variant="outline">장: {chapters.toLocaleString('ko-KR')}</Badge>
				</li>
				<li>
					<Badge variant="outline">섹션: {sections.toLocaleString('ko-KR')}</Badge>
				</li>
				<li>
					<Badge variant="outline">페이지: {pages.toLocaleString('ko-KR')}</Badge>
				</li>
			</ul>
		</section>
	)
}
