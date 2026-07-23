'use client'

import { Add } from '@carbon/icons-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
	GuidelineSearch,
	type GuidelineSearchChapter,
} from '@/components/global/search/guideline-search'
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const STUDIO_LINKS = [
	{ href: '/create', label: 'Templates' },
	{ href: '/generate', label: 'Generate' },
	{ href: '/review', label: 'Review' },
] as const

type MegaMenuLink = {
	active: boolean
	href: string
	label: string
}

function MegaMenuContent({
	description,
	label,
	links,
}: {
	description: string
	label: string
	links: MegaMenuLink[]
}) {
	return (
		<div
			data-slot="mega-menu-content"
			className="grid min-h-80 w-full gap-10 bg-popover p-8 text-popover-foreground md:grid-cols-2 md:p-12"
		>
			<div className="flex flex-col gap-8">
				<Typography as="p" size="xs" weight="semibold">
					{label.toUpperCase()}
				</Typography>
				<Typography tone="muted">{description}</Typography>
			</div>
			<ul className="flex flex-col items-start gap-1">
				{links.map((link) => (
					<li className="w-full" key={link.href}>
						<NavigationMenuLink
							active={link.active}
							asChild
							className="w-full justify-start"
						>
							<Link aria-current={link.active ? 'page' : undefined} href={link.href}>
								<Add aria-hidden="true" />
								<Typography as="span" size="lg">
									{link.label}
								</Typography>
							</Link>
						</NavigationMenuLink>
					</li>
				))}
			</ul>
		</div>
	)
}

function HeaderHead({
	activeMenu,
	className,
	guidelineChapters,
	onActiveMenuChange,
}: {
	activeMenu: string
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
	onActiveMenuChange: (value: string) => void
}) {
	const pathname = usePathname()
	const LOGO_SIZE = 14
	const guidelineActive = pathname === '/guideline' || pathname.startsWith('/guideline/')
	const studioActive = STUDIO_LINKS.some(
		({ href }) => pathname === href || pathname.startsWith(`${href}/`),
	)
	const guidelineLinks = [
		{ active: pathname === '/guideline', href: '/guideline', label: 'Overview' },
		...guidelineChapters.map((chapter) => ({
			active: pathname === chapter.href || pathname.startsWith(`${chapter.href}/`),
			href: chapter.href,
			label: chapter.title,
		})),
	]
	const studioLinks = STUDIO_LINKS.map((item) => ({
		active: pathname === item.href || pathname.startsWith(`${item.href}/`),
		...item,
	}))

	return (
		<section className={className}>
			<nav
				aria-label="주요 메뉴"
				className="flex items-center gap-1 py-2 pl-5 font-body text-base font-normal"
			>
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
				<NavigationMenu
					className="static max-w-none"
					onValueChange={onActiveMenuChange}
					value={activeMenu}
					viewportClassName="mt-0 w-full rounded-none border-b border-border shadow-lg md:w-full"
				>
					<NavigationMenuList className="gap-2">
						<NavigationMenuItem value="guideline">
							<NavigationMenuTrigger
								className={cn(guidelineActive && 'text-foreground')}
							>
								Guideline
							</NavigationMenuTrigger>
							<NavigationMenuContent className="p-0 md:w-full">
								<MegaMenuContent
									description="브랜드의 원칙과 제작 기준을 탐색합니다."
									label="Guideline"
									links={guidelineLinks}
								/>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem value="studio">
							<NavigationMenuTrigger
								className={cn(studioActive && 'text-foreground')}
							>
								Studio
							</NavigationMenuTrigger>
							<NavigationMenuContent className="p-0 md:w-full">
								<MegaMenuContent
									description="브랜드 자산을 활용해 결과물을 제작하고 검수합니다."
									label="Studio"
									links={studioLinks}
								/>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/admin"
									rel="noreferrer"
									target="_blank"
									className="text-muted-foreground/50"
								>
									Admin ↗
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</nav>
		</section>
	)
}

function HeaderTail({
	className,
	guidelineChapters,
}: {
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<section className={className}>
			<GuidelineSearch chapters={guidelineChapters} />
			<SidebarTrigger variant="outline" size="default" className="p-3 py-4 rounded-full">
				Ask AI
			</SidebarTrigger>
		</section>
	)
}

export function GlobalHeader({
	guidelineChapters,
}: {
	guidelineChapters: GuidelineSearchChapter[]
}) {
	const [activeMenu, setActiveMenu] = useState('')

	return (
		<>
			<header className="relative z-50 flex shrink-0 border-b border-border bg-background">
				<HeaderHead
					activeMenu={activeMenu}
					className=""
					guidelineChapters={guidelineChapters}
					onActiveMenuChange={setActiveMenu}
				/>
				<HeaderTail
					className="ml-auto flex items-center gap-2 p-2 px-4"
					guidelineChapters={guidelineChapters}
				/>
			</header>
			{activeMenu && (
				<button
					aria-label="메뉴 닫기"
					className="fixed inset-0 z-40 cursor-default border-0 bg-background/60 p-0 backdrop-blur-sm"
					onClick={() => setActiveMenu('')}
					tabIndex={-1}
					type="button"
				/>
			)}
		</>
	)
}
