import { SideNav, type SideNavGroup } from '@/components/global/side-nav'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'

type CheckNavSection = Pick<
	CheckSection,
	'title' | 'slug' | 'chapterTitle' | 'chapterSlug' | 'sectionTitle' | 'sectionSlug'
>

/**
 * 단일 check 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * 사이트 공통 SideNav로 렌더해 스타일을 통일한다(앵커 href는 SideNav가 <a>로 렌더).
 */
export function CheckSideNavigation({ sections }: { sections: CheckNavSection[] }) {
	return <SideNav groups={toCheckSideNavGroups(sections)} />
}

export function toCheckSideNavGroups(sections: CheckNavSection[]): SideNavGroup[] {
	const groups: SideNavGroup[] = []
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
				href: `#${section.slug}`,
				children: [],
			}
			bySectionSlug.set(sectionKey, item)
			group.items.push(item)
		}
		item.children?.push({
			key: section.slug,
			label: section.title,
			href: `#${section.slug}`,
		})
	}

	return groups.map((group) => ({
		...group,
		items: group.items.map((item) => ({
			...item,
			children:
				item.children?.length === 1 && item.children[0]?.label.trim() === item.label.trim()
					? []
					: item.children,
		})),
	}))
}
