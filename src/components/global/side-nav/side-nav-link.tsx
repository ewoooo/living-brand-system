import Link from 'next/link'
import { SidebarMenuButton, SidebarMenuSubButton } from '@/components/ui/sidebar'

function isAnchor(href: string) {
	return href.startsWith('#')
}

export function getSideNavLinkClassName(nested: boolean) {
	return nested
		? 'text-sidebar-foreground/40 data-active:text-sidebar-foreground'
		: 'text-sidebar-foreground/65 data-active:text-sidebar-foreground'
}

export function SideNavLink({
	label,
	href,
	active,
	nested,
}: {
	label: string
	href: string
	active: boolean
	nested: boolean
}) {
	const Button = nested ? SidebarMenuSubButton : SidebarMenuButton
	const className = getSideNavLinkClassName(nested)

	if (isAnchor(href)) {
		return (
			<Button asChild className={className} isActive={active} size="sm">
				<a href={href}>
					<span>{label}</span>
				</a>
			</Button>
		)
	}

	return (
		<Button asChild className={className} isActive={active} size="sm">
			<Link href={href} aria-current={active ? 'page' : undefined}>
				<span>{label}</span>
			</Link>
		</Button>
	)
}
