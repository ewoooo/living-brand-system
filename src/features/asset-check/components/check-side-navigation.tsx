import { SideNav, type SideNavGroup } from '@/components/global/side-nav'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { toCheckRuleAnchor } from '@/features/asset-check/utils/check-rule-anchor'

type CheckNavSection = Pick<
	CheckSection,
	'title' | 'slug' | 'chapterTitle' | 'chapterSlug' | 'sectionTitle' | 'sectionSlug' | 'rules'
>

/**
 * check 영역 nav — 검수 실행 화면으로 가는 링크와 룰 조회 페이지의 앵커 링크를 함께 렌더한다.
 * 사이트 공통 SideNav로 렌더해 스타일을 통일한다(앵커 href는 SideNav가 <a>로 렌더).
 */
export function CheckSideNavigation({ sections }: { sections: CheckNavSection[] }) {
	return <SideNav groups={toCheckSideNavGroups(sections)} />
}

export function toCheckSideNavGroups(sections: CheckNavSection[]): SideNavGroup[] {
	const groups: SideNavGroup[] = [
		{
			key: 'review',
			items: [{ key: 'review', label: '검수하기', href: '/review' }],
		},
	]
	const byChapterSlug = new Map<string, SideNavGroup>()
	const bySectionSlug = new Map<string, SideNavGroup['items'][number]>()
	for (const section of sections) {
		let group = byChapterSlug.get(section.chapterSlug)
		if (!group) {
			group = { key: section.chapterSlug, title: section.chapterTitle, items: [] }
			byChapterSlug.set(section.chapterSlug, group)
			groups.push(group)
		}

		const sectionKey = `${section.chapterSlug}:${section.sectionSlug}`
		let item = bySectionSlug.get(sectionKey)
		if (!item) {
			item = {
				key: sectionKey,
				label: section.sectionTitle,
				href: `/review/rules#${section.slug}`,
				children: [],
			}
			bySectionSlug.set(sectionKey, item)
			group.items.push(item)
		}
		for (const rule of section.rules) {
			item.children?.push({
				key: `${section.slug}:${rule.key}`,
				label: rule.title,
				href: `/review/rules#${toCheckRuleAnchor(section.slug, rule.key)}`,
			})
		}
	}

	return groups.map((group) => ({
		...group,
		items: group.items.map((item) => ({
			...item,
			children: item.children,
		})),
	}))
}
