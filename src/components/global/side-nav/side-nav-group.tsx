import Link from 'next/link'
import type { ReactNode } from 'react'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from '@/components/ui/sidebar'

export function SideNavGroup({
	title,
	titleHref,
	children,
}: {
	title?: string
	titleHref?: string
	children?: ReactNode
}) {
	return (
		<SidebarGroup>
			<SideNavGroupTitle title={title} titleHref={titleHref} />
			{children && (
				<SidebarGroupContent>
					{/* 그룹 항목(section/category)을 라벨(chapter) 대비 한 단 들여써 계층을 시각화 — section→page(pl-3)와 동일 간격.
					    gap-0: section 사이 간격을 살짝 좁혀 한 챕터 묶음이 더 뭉치게. */}
					<SidebarMenu className="gap-0 pl-3">{children}</SidebarMenu>
				</SidebarGroupContent>
			)}
		</SidebarGroup>
	)
}

function SideNavGroupTitle({ title, titleHref }: { title?: string; titleHref?: string }) {
	if (!title) return null
	const className =
		'text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

	if (titleHref) {
		return (
			<SidebarGroupLabel asChild className={className}>
				<Link href={titleHref}>{title}</Link>
			</SidebarGroupLabel>
		)
	}
	return <SidebarGroupLabel className={className}>{title}</SidebarGroupLabel>
}
