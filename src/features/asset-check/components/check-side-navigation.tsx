import { SideNav, type SideNavGroup } from '@/components/side-nav'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'

type CheckNavSection = Pick<CheckSection, 'title' | 'slug' | 'groupTitle' | 'groupSlug'>

/**
 * 단일 check 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * 사이트 공통 SideNav로 렌더해 스타일을 통일한다(앵커 href는 SideNav가 <a>로 렌더).
 */
export function CheckSideNavigation({ sections }: { sections: CheckNavSection[] }) {
	const groups: SideNavGroup[] = []
	const byGroupSlug = new Map<string, SideNavGroup>()
	for (const section of sections) {
		let group = byGroupSlug.get(section.groupSlug)
		if (!group) {
			group = { key: section.groupSlug, title: section.groupTitle, items: [] }
			byGroupSlug.set(section.groupSlug, group)
			groups.push(group)
		}
		group.items.push({
			key: section.slug,
			label: section.title,
			href: `#${section.slug}`,
		})
	}

	return (
		<SideNav
			groups={groups}
			empty={<div className="px-4 py-2 text-neutral-400 text-xs">No pages</div>}
		/>
	)
}
