'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeaderLinkBlock } from '@/components/global/header/header-link-block'
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
	navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const STUDIO_LINKS = [
	{ href: '/create', label: 'Templates' },
	{ href: '/image', label: 'Image' },
] as const

const LOGIN = { href: '/login', label: 'Admin' } as const

function HeaderHead({
	className,
	guidelineChapters,
}: {
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
}) {
	const pathname = usePathname()
	const LOGO_SIZE = 14
	const guidelineActive = pathname === '/guideline' || pathname.startsWith('/guideline/')
	const reviewActive = pathname === '/review' || pathname.startsWith('/review/')
	const studioActive = STUDIO_LINKS.some(
		({ href }) => pathname === href || pathname.startsWith(`${href}/`),
	)

	return (
		<section className={className}>
			<nav aria-label="주요 메뉴" className="type-body flex items-center gap-1 py-4 pl-5">
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
				<NavigationMenu viewport={false}>
					<NavigationMenuList className="gap-2">
						<NavigationMenuItem>
							<NavigationMenuTrigger
								className={cn(guidelineActive && 'text-foreground')}
							>
								Guideline
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-72 gap-1">
									<li>
										<NavigationMenuLink
											active={pathname === '/guideline'}
											asChild
										>
											<Link
												aria-current={
													pathname === '/guideline' ? 'page' : undefined
												}
												href="/guideline"
											>
												Overview
											</Link>
										</NavigationMenuLink>
									</li>
									{guidelineChapters.map((chapter) => {
										const active =
											pathname === chapter.href ||
											pathname.startsWith(`${chapter.href}/`)

										return (
											<li key={chapter.id}>
												<NavigationMenuLink
													active={active}
													asChild
													className="flex-col items-start gap-0.5"
												>
													<Link
														aria-current={active ? 'page' : undefined}
														href={chapter.href}
													>
														<span>{chapter.title}</span>
														{chapter.description && (
															<span className="text-muted-foreground">
																{chapter.description}
															</span>
														)}
													</Link>
												</NavigationMenuLink>
											</li>
										)
									})}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuTrigger
								className={cn(studioActive && 'text-foreground')}
							>
								Studio
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-48 gap-1">
									{STUDIO_LINKS.map((item) => {
										const active =
											pathname === item.href ||
											pathname.startsWith(`${item.href}/`)

										return (
											<li key={item.href}>
												<NavigationMenuLink active={active} asChild>
													<Link
														aria-current={active ? 'page' : undefined}
														href={item.href}
													>
														{item.label}
													</Link>
												</NavigationMenuLink>
											</li>
										)
									})}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink
								active={reviewActive}
								asChild
								className={navigationMenuTriggerStyle()}
							>
								<Link
									aria-current={reviewActive ? 'page' : undefined}
									href="/review"
								>
									Review
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
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
			<HeaderHead className="flex-1" guidelineChapters={guidelineChapters} />
			<HeaderCenter
				className="-translate-x-1/2 absolute left-1/2 flex items-center gap-2 p-4"
				guidelineChapters={guidelineChapters}
			/>
			<HeaderTail className="ml-auto flex items-center gap-2 p-4" login={LOGIN} />
		</header>
	)
}
