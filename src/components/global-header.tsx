import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const mainNavigationItems = [
	{ href: '/', label: 'Main' },
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/create', label: 'Create' },
] as const

type HeaderProps = {
	className?: string
}

function HeaderLinkBlock({ href, label }: { href: string; label: string }) {
	return (
		<Link href={href}>
			<span className="rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-neutral-400/10">
				{label}
			</span>
		</Link>
	)
}

function HeaderHead({ className }: HeaderProps) {
	return (
		<section className={className}>
			<nav className="flex gap-1 py-4 pl-5 font-[450] text-sm tracking-[0.02em]">
				{mainNavigationItems.map((item) => (
					<HeaderLinkBlock key={item.href} href={item.href} label={item.label} />
				))}
			</nav>
		</section>
	)
}

function HeaderTail({ className }: HeaderProps) {
	return (
		<section className={className}>
			<ThemeToggle />
		</section>
	)
}

export function GlobalHeader() {
	return (
		<header className="sticky top-0 z-10 flex bg-white dark:bg-black">
			<HeaderHead className="flex-1" />
			<HeaderTail className="ml-auto p-4" />
		</header>
	)
}
