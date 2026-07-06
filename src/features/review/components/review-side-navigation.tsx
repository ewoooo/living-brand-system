import { SideNav, type SideNavGroup } from '@/components/side-nav'

/**
 * 단일 review 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * 사이트 공통 SideNav로 렌더해 스타일을 통일한다(앵커 href는 SideNav가 <a>로 렌더).
 * 섹션 자체가 목차 항목이라 그룹 제목은 두지 않는다(평면 목차).
 */
export function ReviewSideNavigation({
	sections,
}: {
	sections: { title: string; slug: string }[]
}) {
	const groups: SideNavGroup[] =
		sections.length > 0
			? [
					{
						key: 'review-sections',
						items: sections.map((section) => ({
							key: section.slug,
							label: section.title,
							href: `#${section.slug}`,
						})),
					},
				]
			: []

	return (
		<SideNav
			groups={groups}
			empty={<div className="px-4 py-2 text-neutral-400 text-xs">No pages</div>}
		/>
	)
}
