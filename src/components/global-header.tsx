'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

const mainNavigationItems = [
	{ href: '/', label: 'Main' },
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/create', label: 'Create' },
	{ href: '/admin', label: 'Login' },
] as const

function HeaderLinkBlock({
	href,
	isActive,
	label,
}: {
	href: string
	isActive: boolean
	label: string
}) {
	return (
		<Link href={href}>
			<span
				className={cn(
					'rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-neutral-400/10',
					isActive ? 'text-foreground' : 'text-neutral-500/50',
				)}
			>
				{label}
			</span>
		</Link>
	)
}

function HeaderHead({ className }: { className?: string }) {
	const pathname = usePathname()

	return (
		<section className={className}>
			<nav className="flex gap-1 py-4 pl-5 font-[450] text-sm tracking-[0.02em]">
				{mainNavigationItems.map((item) => (
					<HeaderLinkBlock
						key={item.href}
						href={item.href}
						isActive={
							item.href === '/'
								? pathname === '/'
								: pathname === item.href || pathname.startsWith(`${item.href}/`)
						}
						label={item.label}
					/>
				))}
			</nav>
		</section>
	)
}

export function GlobalHeader() {
	return (
		<header className="sticky top-0 z-10 flex bg-white dark:bg-black">
			<HeaderHead className="flex-1" />
			<section className="ml-auto p-4">
				<ThemeToggle />
			</section>
		</header>
	)
}
