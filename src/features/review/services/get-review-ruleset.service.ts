import { cache } from 'react'
import { listPublishedPagesWithRules } from '@/features/review/repositories/review-ruleset.payload.repository'

export interface ReviewRule {
	/** 배치(배열 행) id — 같은 rule key가 한 페이지에 여러 배치로 등장할 수 있어 행 식별에 쓴다 */
	placementId: string
	key: string
	titleKo: string
	tier: string
	evidence: string
}

/** 검수 화면의 그룹 단위 = 룰 배치를 가진 가이드라인 페이지 (The Name, Brand Logo, …). */
export interface ReviewSection {
	title: string
	slug: string
	rules: ReviewRule[]
}

/**
 * 검수 화면용 룰셋 뷰모델 — 페이지의 rules 배치를 그대로 묶는다 (목차·본문·검수 대상의 단일 소스).
 * 정렬: 섹션 displayOrder → 페이지 displayOrder → 배치 순서. Payload 접근은 repository가 소유한다.
 * layout과 page가 같은 요청에서 함께 부르므로 React cache로 요청당 1회만 조회한다.
 */
export const getReviewRuleset = cache(async (): Promise<ReviewSection[]> => {
	const pages = await listPublishedPagesWithRules()

	return pages
		.filter((page) => (page.rules?.length ?? 0) > 0)
		.sort((a, b) => {
			const sectionOrder = (page: (typeof pages)[number]) =>
				typeof page.section === 'number' ? 0 : page.section.displayOrder
			return sectionOrder(a) - sectionOrder(b) || a.displayOrder - b.displayOrder
		})
		.map((page) => ({
			title: page.title,
			slug: page.slug ?? String(page.id),
			rules: (page.rules ?? []).flatMap((placement) => {
				const rule = placement.rule
				if (typeof rule === 'number') return []
				return [
					{
						placementId: placement.id ?? rule.key,
						key: rule.key,
						titleKo: rule.titleKo ?? rule.title,
						tier: rule.tier ?? '',
						evidence: placement.evidence ?? '',
					},
				]
			}),
		}))
})
