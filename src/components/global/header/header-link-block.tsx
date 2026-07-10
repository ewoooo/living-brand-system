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
					'rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-neutral-400/10 hover:text-neutral-500',
					isActive ? 'text-foreground' : 'text-neutral-500/50',
				)}
			>
				{label}
			</span>
		</Link>
	)
}
