'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Kbd, KbdGroup } from './ui/kbd'

const NAVIGATION_ITEMS = [
	{ href: '/', label: 'Main' },
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/review', label: 'Review' },
	{ href: '/create', label: 'Create' },
	{ href: '/login', label: 'Login' },
] as const

const LINKS = NAVIGATION_ITEMS.slice(0, -1)
const LOGIN = NAVIGATION_ITEMS.at(-1)

type GuidelineSearchSection = GetGuidelineNavigationOutput['sections'][number]

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
				{LINKS.map((item) => (
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

function GuidelineSearch({ sections }: { sections: GuidelineSearchSection[] }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault()
				setOpen((current) => !current)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<Button
				aria-label="Toggle guideline search"
				variant="outline"
				onClick={() => setOpen((current) => !current)}
			>
				<span className="pr-8 text-neutral-500">Search Guideline...</span>
				<KbdGroup>
					<Kbd>CMD</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen} title="Search Guideline">
				<Command>
					<CommandInput placeholder="Search guideline pages..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						{sections.map((section) => (
							<CommandGroup heading={section.title} key={section.id}>
								{section.pages.map((page) => (
									<CommandItem
										key={page.id}
										value={`${section.title} ${page.title}`}
										onSelect={() => {
											setOpen(false)
											router.push(page.href)
										}}
									>
										<span>{page.title}</span>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	)
}

export function GlobalHeader({
	guidelineSections,
}: {
	guidelineSections: GuidelineSearchSection[]
}) {
	return (
		<header className="sticky top-0 z-10 flex bg-white dark:bg-black">
			<HeaderHead className="flex-1" />
			<section className="ml-auto p-4 flex gap-2">
				<GuidelineSearch sections={guidelineSections} />
				{LOGIN && (
					<HeaderLinkBlock href={LOGIN.href} isActive={false} label={LOGIN.label} />
				)}
				{/*<ThemeToggle />*/}
				<Button>Ask AI</Button>
			</section>
		</header>
	)
}
