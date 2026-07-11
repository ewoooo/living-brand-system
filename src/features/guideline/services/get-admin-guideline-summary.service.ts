import { findAdminGuidelineSummary } from '@/features/guideline/repositories/admin-guideline-summary.payload.repository'

/**
 * Admin 대시보드에 현재 Section, Page, Check 수를 제공한다.
 * Payload 조회 I/O는 admin-guideline-summary repository가 소유한다.
 */
export function getAdminGuidelineSummary() {
	return findAdminGuidelineSummary()
}
