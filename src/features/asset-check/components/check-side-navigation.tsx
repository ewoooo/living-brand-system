import {
	SideNav,
	SideNavBranch,
	SideNavGroup,
	SideNavItem,
	SideNavSubItem,
} from '@/components/global/side-nav/side-nav'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { toCheckRuleAnchor } from '@/features/asset-check/utils/check-rule-anchor'

type CheckNavSection = Pick<
	CheckSection,
	'title' | 'slug' | 'chapterTitle' | 'chapterSlug' | 'sectionTitle' | 'sectionSlug' | 'rules'
>

interface CheckNavigationChapter {
	slug: string
	title: string
	sections: {
		slug: string
		title: string
		href: string
		rules: { key: string; title: string; href: string }[]
	}[]
}

/**
 * check 영역 nav — 평탄한 검수 페이지를 chapter → section → rule로 묶어 직접 렌더한다.
 */
export function CheckSideNavigation({ sections }: { sections: CheckNavSection[] }) {
	const chapters = groupCheckSectionsByChapter(sections)

	return (
		<SideNav>
			<SideNavGroup>
				<SideNavItem label="검수하기" href="/review" />
			</SideNavGroup>
			{chapters.map((chapter) => (
				<SideNavGroup key={chapter.slug} title={chapter.title}>
					{chapter.sections.map((section) => (
						<SideNavBranch
							key={section.slug}
							label={section.title}
							activeHref={section.href}
						>
							{section.rules.map((rule) => (
								<SideNavSubItem
									key={rule.key}
									label={rule.title}
									href={rule.href}
								/>
							))}
						</SideNavBranch>
					))}
				</SideNavGroup>
			))}
		</SideNav>
	)
}

export function groupCheckSectionsByChapter(sections: CheckNavSection[]): CheckNavigationChapter[] {
	const chapters: CheckNavigationChapter[] = []
	const byChapterSlug = new Map<string, CheckNavigationChapter>()
	const bySectionSlug = new Map<string, CheckNavigationChapter['sections'][number]>()
	for (const page of sections) {
		let chapter = byChapterSlug.get(page.chapterSlug)
		if (!chapter) {
			chapter = { slug: page.chapterSlug, title: page.chapterTitle, sections: [] }
			byChapterSlug.set(page.chapterSlug, chapter)
			chapters.push(chapter)
		}

		const sectionKey = `${page.chapterSlug}:${page.sectionSlug}`
		let section = bySectionSlug.get(sectionKey)
		if (!section) {
			section = {
				slug: page.sectionSlug,
				title: page.sectionTitle,
				href: `/review/rules#${page.slug}`,
				rules: [],
			}
			bySectionSlug.set(sectionKey, section)
			chapter.sections.push(section)
		}
		for (const rule of page.rules) {
			section.rules.push({
				key: `${page.slug}:${rule.key}`,
				title: rule.title,
				href: `/review/rules#${toCheckRuleAnchor(page.slug, rule.key)}`,
			})
		}
	}

	return chapters
}
