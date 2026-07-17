import { listAdminGuidelineSummaryDocuments } from '@/features/guideline/repositories/admin-guideline-summary.payload.repository'

/**
 * Admin 대시보드에 현재 깊이별 Guideline 문서와 Check 수를 제공한다.
 * 깊이 분류와 Check 합계는 이 유스케이스가, Payload 조회·변환 I/O는 repository가 소유한다.
 */
export async function getAdminGuidelineSummary() {
	const documents = await listAdminGuidelineSummaryDocuments()
	const summary = { checks: 0, chapters: 0, sections: 0, pages: 0 }

	for (const document of documents) {
		summary.checks += document.checkKeys.length
		switch (document.breadcrumbDocumentIds.length) {
			case 1:
				summary.chapters += 1
				break
			case 2:
				summary.sections += 1
				break
			case 3:
				summary.pages += 1
		}
	}

	return summary
}
