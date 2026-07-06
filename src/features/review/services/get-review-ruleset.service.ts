import { cache } from 'react'
import { listRuleBindingPlacements } from '@/features/review/repositories/review-ruleset.payload.repository'

export interface ReviewRule {
	/** binding id — 같은 rule key가 한 섹션에 여러 배치로 등장할 수 있어 행 식별에 쓴다 */
	bindingId: number
	key: string
	titleKo: string
	tier: string
	evidence: string
}

export interface ReviewSection {
	title: string
	slug: string
	rules: ReviewRule[]
}

/**
 * 검수 화면용 룰셋 뷰모델 — rule-bindings를 섹션 단위로 묶는다 (목차·본문·검수 대상의 단일 소스).
 * 정렬: 섹션·페이지 displayOrder → 배치 id. Payload 접근은 review-ruleset repository가 소유한다.
 * layout과 page가 같은 요청에서 함께 부르므로 React cache로 요청당 1회만 조회한다.
 */
export const getReviewRuleset = cache(async (): Promise<ReviewSection[]> => {
	const bindings = await listRuleBindingPlacements()

	interface SectionDraft {
		order: number
		title: string
		slug: string
		pages: Map<number, { order: number; rules: ReviewRule[] }>
	}
	const sections = new Map<number, SectionDraft>()

	for (const binding of bindings) {
		const { page, rule } = binding
		if (typeof page === 'number' || typeof rule === 'number') continue
		const section = page.section
		if (typeof section === 'number') continue

		let sectionDraft = sections.get(section.id)
		if (!sectionDraft) {
			sectionDraft = {
				order: section.displayOrder,
				title: section.title,
				slug: section.slug ?? String(section.id),
				pages: new Map(),
			}
			sections.set(section.id, sectionDraft)
		}
		let pageDraft = sectionDraft.pages.get(page.id)
		if (!pageDraft) {
			pageDraft = { order: page.displayOrder, rules: [] }
			sectionDraft.pages.set(page.id, pageDraft)
		}
		pageDraft.rules.push({
			bindingId: binding.id,
			key: rule.key,
			titleKo: rule.titleKo ?? rule.title,
			tier: rule.tier ?? '',
			evidence: binding.evidence ?? '',
		})
	}

	return [...sections.values()]
		.sort((a, b) => a.order - b.order)
		.map((section) => ({
			title: section.title,
			slug: section.slug,
			rules: [...section.pages.values()]
				.sort((a, b) => a.order - b.order)
				.flatMap((page) => page.rules),
		}))
})
