'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeaderLinkBlock } from '@/components/global/header/header-link-block'
import {
	GuidelineSearch,
	type GuidelineSearchChapter,
} from '@/components/global/search/guideline-search'
import { SidebarTrigger } from '@/components/ui/sidebar'

const LINKS = [
	{ href: '/guideline', label: 'Guideline' },
	{ href: '/review', label: 'Review' },
	{ href: '/create', label: 'Create' },
	{ href: '/image', label: 'Image' },
] as const

const LOGIN = { href: '/login', label: 'Admin' } as const

function HeaderHead({ className }: { className?: string }) {
	const pathname = usePathname()
	const LOGO_SIZE = 14

	return (
		<section className={className}>
			<nav className="type-body flex items-center gap-1 py-4 pl-5">
				<Link
					aria-label="메인으로 이동"
					className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-60"
					href="/"
				>
					<Image
						alt=""
						className="size-3.5 brightness-0 dark:invert"
						height={LOGO_SIZE}
						src="/logos/logo.svg"
						width={LOGO_SIZE}
					/>
				</Link>
				{LINKS.map((item) => (
					<HeaderLinkBlock
						key={item.href}
						href={item.href}
						isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
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
		<header className="relative z-50 flex shrink-0 bg-background">
			<HeaderHead className="flex-1" />
			<HeaderCenter
				className="-translate-x-1/2 absolute left-1/2 flex items-center gap-2 p-4"
				guidelineChapters={guidelineChapters}
			/>
			<HeaderTail className="ml-auto flex items-center gap-2 p-4" login={LOGIN} />
		</header>
	)
}
