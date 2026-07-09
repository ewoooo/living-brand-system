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
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Kbd, KbdGroup } from './ui/kbd'

const LINKS = [
	{ href: '/', label: 'Main' },
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/review', label: 'Review' },
	{ href: '/create', label: 'Create' },
	{ href: '/image', label: 'Image' },
] as const

const LOGIN = { href: '/login', label: 'Admin Login (Temp)' } as const

type GuidelineSearchChapter = GetGuidelineNavigationOutput['chapters'][number]

function HeaderLinkBlock({
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

function HeaderHead({ className }: { className?: string }) {
	const pathname = usePathname()

	return (
		<section className={className}>
			<nav className="flex gap-1 py-4 pl-5 font-[450] text-sm">
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

function GuidelineSearch({ chapters }: { chapters: GuidelineSearchChapter[] }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				const target = (event.target ?? document.activeElement) as HTMLElement | null
				const tagName = target?.tagName
				if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) {
					return
				}
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
				aria-label="가이드라인 검색"
				variant="secondary"
				className="py-4 pl-3"
				onClick={() => setOpen((current) => !current)}
			>
				<span className="pr-8 text-neutral-500">가이드라인 검색...</span>
				<KbdGroup>
					<Kbd className="bg-neutral-500/10">⌘</Kbd>
					<Kbd className="bg-neutral-500/10">K</Kbd>
				</KbdGroup>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen} title="가이드라인 검색">
				<Command>
					<CommandInput placeholder="가이드라인 페이지 검색..." />
					<CommandList>
						<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
						{chapters.map((chapter) => (
							<CommandGroup heading={chapter.title} key={chapter.id}>
								{chapter.sections.map((section) => (
									<CommandItem
										key={section.id}
										value={`${chapter.title} ${section.title}`}
										onSelect={() => {
											setOpen(false)
											router.push(section.href)
										}}
									>
										<span>{section.title}</span>
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
	guidelineChapters,
}: {
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<header className="z-10 flex shrink-0 bg-white dark:bg-black">
			<HeaderHead className="flex-1" />
			<section className="ml-auto p-4 flex gap-2 items-center">
				<HeaderLinkBlock
					href={LOGIN.href}
					isActive={false}
					label={LOGIN.label}
					rel="noreferrer"
					target="_blank"
				/>
				<GuidelineSearch chapters={guidelineChapters} />
				<SidebarTrigger variant="default" size="default">
					Ask AI
				</SidebarTrigger>
			</section>
		</header>
	)
}
