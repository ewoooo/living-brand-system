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
					<SidebarMenu>{children}</SidebarMenu>
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
