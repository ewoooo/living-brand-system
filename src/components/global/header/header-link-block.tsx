import Link from 'next/link'
import { cn } from '@/lib/utils'

export function HeaderLinkBlock({
	href,
	isActive,
	label,
	rel,
	target,
}: {
	href: string
	isActive: boolean
	label: string
	rel?: string
	target?: string
}) {
	return (
		<Link href={href} rel={rel} target={target}>
			<span
				className={cn(
					'rounded-md px-2.5 py-1.5 transition-colors hover:bg-fill-hover hover:text-foreground-muted',
					isActive ? 'text-foreground' : 'text-foreground-muted/50',
				)}
			>
				{label}
			</span>
		</Link>
	)
}
