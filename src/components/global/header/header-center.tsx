'use client'

import { cva } from 'class-variance-authority'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { GuidelineSearchChapter } from '@/components/global/header/header-tail'
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
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

const STUDIO_LINKS = [
	{ href: routes.studio.root, label: 'Overview' },
	{ href: routes.studio.examples, label: 'Examples' },
	{ href: routes.studio.template, label: 'Templates' },
	{ href: routes.studio.generateImage, label: 'Image' },
	{ href: routes.studio.generateGraphic, label: 'Graphic' },
	{ href: routes.studio.review, label: 'Review' },
] as const

const headerNavigationItemVariants = cva(
	'bg-transparent opacity-20 transition-opacity hover:bg-transparent hover:opacity-100 focus:bg-transparent focus:opacity-100',
	{
		variants: {
			state: {
				active: 'data-[active=true]:bg-transparent data-[active=true]:opacity-100 data-[active=true]:hover:bg-transparent data-[active=true]:focus:bg-transparent',
				open: 'data-popup-open:bg-transparent data-popup-open:hover:bg-transparent data-popup-open:opacity-100 data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-open:opacity-100',
			},
		},
	},
)

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
		<section
			data-slot="mega-menu-content"
			className="grid min-h-80 w-full max-w-256 gap-10 bg-popover p-8 text-popover-foreground mx-auto md:grid-cols-2"
		>
			<div className="flex flex-col gap-2 md:gap-6">
				<Typography as="p" size="xs" weight="medium">
					{label}
				</Typography>
				<Typography as="p" size="xl" weight="normal">
					{description}
				</Typography>
			</div>
			{/* Detail */}
			<div className="flex flex-col gap-2 md:gap-6">
				<Typography as="p" size="xs" weight="medium">
					Contents
				</Typography>
				<ul className="flex flex-col items-start gap-2">
					{links.map((link) => (
						<li className="w-full" key={link.href}>
							<NavigationMenuLink
								active={link.active}
								asChild
								className={cn(
									'w-full justify-start',
									headerNavigationItemVariants({ state: 'active' }),
								)}
							>
								<Link
									aria-current={link.active ? 'page' : undefined}
									href={link.href}
								>
									<Typography as="span" size="xl">
										{link.label}
									</Typography>
								</Link>
							</NavigationMenuLink>
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}

export function HeaderCenter({
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
	const router = useRouter()
	const navigationGroups = [
		{
			active: pathname === routes.guideline || pathname.startsWith(`${routes.guideline}/`),
			description: '브랜드의 원칙과 제작 기준을 탐색합니다.',
			label: 'Guideline',
			links: [
				{
					active: pathname === routes.guideline,
					href: routes.guideline,
					label: 'Overview',
				},
				...guidelineChapters.map((chapter) => ({
					active: pathname === chapter.href || pathname.startsWith(`${chapter.href}/`),
					href: chapter.href,
					label: chapter.title,
				})),
			],
			href: routes.guideline,
			value: 'guideline',
		},
		{
			active:
				pathname === routes.studio.root || pathname.startsWith(`${routes.studio.root}/`),
			description: '브랜드 자산을 활용해 결과물을 제작하고 검수합니다.',
			label: 'Studio',
			links: STUDIO_LINKS.map((item) => ({
				active:
					pathname === item.href ||
					(item.href !== routes.studio.root && pathname.startsWith(`${item.href}/`)),
				...item,
			})),
			href: routes.studio.root,
			value: 'studio',
		},
	]

	return (
		<section
			data-slot="header-center"
			className={cn('text-sm tracking-[-0.01rem] font-medium', className)}
		>
			<nav aria-label="주요 메뉴" className="flex items-center gap-1 py-2">
				<NavigationMenu
					className="static max-w-none"
					onValueChange={onActiveMenuChange}
					value={activeMenu}
					viewportClassName="mt-0 w-full origin-top rounded-none border-b border-border shadow-sm ring-0 duration-200 md:w-full data-open:fade-in-0 data-open:slide-in-from-top-2 data-open:zoom-in-100 data-closed:fade-out-0 data-closed:slide-out-to-top-2 data-closed:zoom-out-100"
				>
					<NavigationMenuList className="gap-2">
						{navigationGroups.map((group) => (
							<NavigationMenuItem key={group.value} value={group.value}>
								<NavigationMenuTrigger
									className={cn(
										headerNavigationItemVariants({ state: 'open' }),
										group.active && 'text-foreground opacity-100',
									)}
									onClick={() => router.push(group.href)}
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
							<NavigationMenuLink
								asChild
								className={cn(
									navigationMenuTriggerStyle(),
									headerNavigationItemVariants(),
								)}
							>
								<Link href={routes.admin} rel="noreferrer" target="_blank">
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
