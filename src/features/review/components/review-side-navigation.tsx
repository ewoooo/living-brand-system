'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import type { ReviewNavChapter } from '@/features/review/navigation'

function ReviewChapter({ code, name, sections }: ReviewNavChapter) {
	const pathname = usePathname()

	return (
		<div className="px-2 py-2">
			{/* 챕터명은 클릭 불가 — 인덱스/구분 라벨 (접기 없음) */}
			<div className="px-2 pb-1 font-medium text-muted-foreground text-xs">
				{code}. {name}
			</div>
			{/* 섹션 그룹 왼쪽의 하나의 긴 세로 line */}
			<ul className="ml-2 flex flex-col border-neutral-200 border-l dark:border-neutral-800">
				{sections.map((section) => {
					const active = pathname === section.href
					return (
						<li key={section.slug}>
							<Link
								href={section.href}
								aria-current={active ? 'page' : undefined}
								className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
									active
										? 'border-foreground bg-neutral-500/15 font-medium text-foreground'
										: 'border-transparent text-neutral-500 hover:bg-neutral-500/5 hover:text-foreground'
								}`}
							>
								{section.name}
							</Link>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export function ReviewSideNavigation({ chapters }: { chapters: ReviewNavChapter[] }) {
	return (
		<Sidebar
			collapsible="none"
			className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-y-auto pl-6"
		>
			<SidebarContent className="pt-12">
				{chapters.map((chapter) => (
					<ReviewChapter key={chapter.code} {...chapter} />
				))}
			</SidebarContent>
		</Sidebar>
	)
}
