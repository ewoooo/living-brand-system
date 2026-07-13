'use client'

import { usePathname } from 'next/navigation'
import { HeaderLinkBlock } from '@/components/global/header/header-link-block'
import {
	GuidelineSearch,
	type GuidelineSearchChapter,
} from '@/components/global/search/guideline-search'
import { SidebarTrigger } from '@/components/ui/sidebar'

const LINKS = [
	{ href: '/', label: 'Main' },
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/review', label: 'Review' },
	{ href: '/create', label: 'Create' },
	{ href: '/generate', label: 'Generate' },
] as const

const LOGIN = { href: '/login', label: 'Admin' } as const

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

function HeaderCenter({
	className,
	guidelineChapters,
}: {
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<section className={className}>
			<GuidelineSearch chapters={guidelineChapters} />
			<SidebarTrigger variant="default" size="default">
				Ask AI
			</SidebarTrigger>
		</section>
	)
}

function HeaderTail({ className, login }: { className?: string; login: typeof LOGIN }) {
	return (
		<section className={className}>
			<HeaderLinkBlock
				href={login.href}
				isActive={false}
				label={login.label}
				rel="noreferrer"
				target="_blank"
			/>
		</section>
	)
}

export function GlobalHeader({
	guidelineChapters,
}: {
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<header className="relative z-30 flex shrink-0 bg-white dark:bg-black">
			<HeaderHead className="flex-1" />
			<HeaderCenter
				className="-translate-x-1/2 absolute left-1/2 flex items-center gap-2 p-4"
				guidelineChapters={guidelineChapters}
			/>
			<HeaderTail className="ml-auto flex items-center gap-2 p-4" login={LOGIN} />
		</header>
	)
}
