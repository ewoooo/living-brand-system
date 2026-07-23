'use client'

import { Add } from '@carbon/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { GuidelineSearchChapter } from '@/components/global/header/header-guideline-search'
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
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

function HeaderNavigationContent({
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

export function HeaderPageNavigation({
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
	const navigationGroups = [
		{
			active: pathname === '/guideline' || pathname.startsWith('/guideline/'),
			description: '브랜드의 원칙과 제작 기준을 탐색합니다.',
			label: 'Guideline',
			links: [
				{ active: pathname === '/guideline', href: '/guideline', label: 'Overview' },
				...guidelineChapters.map((chapter) => ({
					active: pathname === chapter.href || pathname.startsWith(`${chapter.href}/`),
					href: chapter.href,
					label: chapter.title,
				})),
			],
			value: 'guideline',
		},
		{
			active: STUDIO_LINKS.some(
				({ href }) => pathname === href || pathname.startsWith(`${href}/`),
			),
			description: '브랜드 자산을 활용해 결과물을 제작하고 검수합니다.',
			label: 'Studio',
			links: STUDIO_LINKS.map((item) => ({
				active: pathname === item.href || pathname.startsWith(`${item.href}/`),
				...item,
			})),
			value: 'studio',
		},
	]

	return (
		<section className={className}>
			<nav aria-label="주요 메뉴" className="flex items-center gap-1 py-2 font-body">
				<NavigationMenu
					className="static max-w-none"
					onValueChange={onActiveMenuChange}
					value={activeMenu}
					viewportClassName="mt-0 w-full origin-top rounded-none border-b border-border shadow-lg duration-200 md:w-full data-open:fade-in-0 data-open:slide-in-from-top-2 data-open:zoom-in-100 data-closed:fade-out-0 data-closed:slide-out-to-top-2 data-closed:zoom-out-100"
				>
					<NavigationMenuList className="gap-2">
						{navigationGroups.map((group) => (
							<NavigationMenuItem key={group.value} value={group.value}>
								<NavigationMenuTrigger
									className={cn(group.active && 'text-foreground')}
								>
									{group.label}
								</NavigationMenuTrigger>
								<NavigationMenuContent
									className="p-0 duration-150 md:w-full"
									motion="fade"
								>
									<HeaderNavigationContent
										description={group.description}
										label={group.label}
										links={group.links}
									/>
								</NavigationMenuContent>
							</NavigationMenuItem>
						))}
						<NavigationMenuItem>
							<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
								<Link href="/admin" rel="noreferrer" target="_blank">
									Admin↗
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</nav>
		</section>
	)
}
