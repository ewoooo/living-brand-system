import { SideNav, type SideNavGroup } from '@/components/side-nav'
import type { ReviewNavChapter } from '@/features/review/navigation'

/**
 * 단일 review 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * 사이트 공통 SideNav를 쓰며, 앵커 href는 SideNav가 <a>로 렌더한다.
 */
export function ReviewSideNavigation({ chapters }: { chapters: ReviewNavChapter[] }) {
	const groups: SideNavGroup[] = chapters.map((chapter) => ({
		key: chapter.code,
		title: `${chapter.code}. ${chapter.name}`,
		items: chapter.sections.map((section) => ({
			key: section.slug,
			label: section.name,
			href: section.href,
		})),
	}))

	return <SideNav groups={groups} />
}
