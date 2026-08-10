import { cva } from 'class-variance-authority'
import Link from 'next/link'
import { SidebarMenuButton, SidebarMenuSubButton } from '@/components/ui/sidebar'

function isAnchor(href: string) {
	return href.startsWith('#')
}

export const sideNavLinkVariants = cva('data-active:text-foreground', {
	variants: {
		nested: {
			true: 'text-foreground/40',
			false: 'text-foreground/65',
		},
	},
	defaultVariants: {
		nested: false,
	},
})

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
	const className = sideNavLinkVariants({ nested })

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
