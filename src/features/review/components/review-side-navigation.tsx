import { Sidebar, SidebarContent } from '@/components/ui/sidebar'

/**
 * 단일 review 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 * guideline 사이드 nav와 동일한 순정 스타일(세로 라인).
 */
export function ReviewSideNavigation({
	sections,
}: {
	sections: { title: string; slug: string }[]
}) {
	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">
				<div className="px-2 py-2">
					{/* 섹션 그룹 왼쪽의 하나의 긴 세로 line */}
					<ul className="ml-2 flex flex-col border-neutral-200 border-l dark:border-neutral-800">
						{sections.map((section) => (
							<li key={section.slug}>
								<a
									href={`#${section.slug}`}
									className="-ml-px block border-transparent border-l-2 py-1.5 pl-4 text-neutral-500 text-sm transition-colors hover:bg-neutral-500/5 hover:text-foreground"
								>
									{section.title}
								</a>
							</li>
						))}
					</ul>
				</div>
			</SidebarContent>
		</Sidebar>
	)
}
