import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { mainNavigationItems } from '@/features/guideline/navigation'

type HeaderProps = {
	className?: string
}

function HeaderLinkBlock({ href, label }: { href: string; label: string }) {
	return (
		<Link href={href}>
			<span className="text-sm hover:bg-neutral-400/10 py-1.5 px-2.5 rounded-md transition-colors">
				{label}
			</span>
		</Link>
	)
}

function HeaderHead({ className }: HeaderProps) {
	return (
		<section className={className}>
			<nav className="flex gap-1 py-4 pl-5 text-sm font-[450] tracking-[0.02em]">
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

export function GuidelineHeader() {
	return (
		<header className="flex">
			<HeaderHead className="flex-1" />
			<HeaderTail className="ml-auto p-4" />
		</header>
	)
}
