import Link from 'next/link'
import type React from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

type HeaderProps = React.ComponentProps<'section'>

function HeaderHead({ className }: HeaderProps) {
	return (
		<section className={className}>
			<nav className="flex gap-4 text-sm">
				<Link href="/">main</Link>
				<Link href="/guideline">guideline</Link>
				<Link href="/create">create</Link>
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
			<HeaderHead className="flex-1 p-4" />
			<HeaderTail className="ml-auto p-4" />
		</header>
	)
}
