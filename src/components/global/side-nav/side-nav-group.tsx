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
					{/* 그룹 항목(section/category)을 라벨(chapter) 대비 한 단 들여써 계층을 시각화 — section→page(pl-3)와 동일 간격 */}
					<SidebarMenu className="pl-3">{children}</SidebarMenu>
				</SidebarGroupContent>
			)}
		</SidebarGroup>
	)
}

function SideNavGroupTitle({ title, titleHref }: { title?: string; titleHref?: string }) {
	if (!title) return null
	const className = 'text-xs font-medium text-foreground'

	if (titleHref) {
		return (
			<SidebarGroupLabel asChild className={className}>
				<Link href={titleHref}>{title}</Link>
			</SidebarGroupLabel>
		)
	}
	return <SidebarGroupLabel className={className}>{title}</SidebarGroupLabel>
}
