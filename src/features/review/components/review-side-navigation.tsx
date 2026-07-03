import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import type { ReviewNavChapter } from '@/features/review/navigation'

/**
 * 단일 review 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * guideline 사이드 nav와 동일한 순정 스타일(세로 라인).
 */
function ReviewChapter({ code, name, sections }: ReviewNavChapter) {
	return (
		<div className="px-2 py-2">
			{/* 챕터명은 인덱스/구분 라벨 */}
			<div className="px-2 pb-1 font-medium text-muted-foreground text-xs">
				{code}. {name}
			</div>
			{/* 섹션 그룹 왼쪽의 하나의 긴 세로 line */}
			<ul className="ml-2 flex flex-col border-neutral-200 border-l dark:border-neutral-800">
				{sections.map((section) => (
					<li key={section.slug}>
						<a
							href={section.href}
							className="-ml-px block border-transparent border-l-2 py-1.5 pl-4 text-neutral-500 text-sm transition-colors hover:bg-neutral-500/5 hover:text-foreground"
						>
							{section.name}
						</a>
					</li>
				))}
			</ul>
		</div>
	)
}

export function ReviewSideNavigation({ chapters }: { chapters: ReviewNavChapter[] }) {
	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">
				{chapters.map((chapter) => (
					<ReviewChapter key={chapter.code} {...chapter} />
				))}
			</SidebarContent>
		</Sidebar>
	)
}
