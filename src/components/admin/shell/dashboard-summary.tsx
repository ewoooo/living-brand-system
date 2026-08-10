import { Badge } from '@/components/ui/badge'
import { getAdminGuidelineSummary } from '@/features/guideline/services/get-admin-guideline-summary.service'

export async function DashboardSummary() {
	const { checks, chapters, sections, pages } = await getAdminGuidelineSummary()

	return (
		<section className="flex aspect-[7/1] w-full flex-col items-center justify-center rounded-3xl border border-border">
			<h2>대시보드 요약</h2>
			<ul className="m-0 flex list-none gap-4 p-0">
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
