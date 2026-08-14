'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NavigationHeader } from '@/components/global/header/navigation-header'
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
import { routes } from '@/lib/routes'

type GuidelineSearchChapter = GetGuidelineNavigationOutput['chapters'][number]

type NavigationHeaderUpdateKey =
	| 'assets'
	| 'graphic'
	| 'guideline'
	| 'image'
	| 'mcp'
	| 'review'
	| 'template'

type NavigationHeaderUpdates = Partial<Record<NavigationHeaderUpdateKey, boolean>>

type GlobalHeaderProps = {
	guidelineChapters: GuidelineSearchChapter[]
	updates?: NavigationHeaderUpdates
}

function isCurrentPath(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`)
}

type HeaderGuidelineSearchDialogProps = {
	chapters: GuidelineSearchChapter[]
	onOpenChange: (open: boolean) => void
	open: boolean
}

function HeaderGuidelineSearchDialog({
	chapters,
	onOpenChange,
	open,
}: HeaderGuidelineSearchDialogProps) {
	const router = useRouter()

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange} title="가이드라인 검색">
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
										onOpenChange(false)
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
	)
}

export function GlobalHeader({ guidelineChapters, updates = {} }: GlobalHeaderProps) {
	const pathname = usePathname()
	const [compactOpen, setCompactOpen] = useState(false)
	const [searchOpen, setSearchOpen] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'k' || (!event.metaKey && !event.ctrlKey)) return

			const target = (event.target ?? document.activeElement) as HTMLElement | null
			const tagName = target?.tagName
			if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) return

			event.preventDefault()
			setSearchOpen((current) => !current)
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	const guidelineItem = {
		current: isCurrentPath(pathname, routes.guideline),
		hasUpdate: updates.guideline,
		href: routes.guideline,
		label: 'Guideline',
	} as const
	const studioCreationItems = [
		{
			current: isCurrentPath(pathname, routes.studio.template),
			hasUpdate: updates.template,
			href: routes.studio.template,
			label: 'Template',
		},
		{
			current: isCurrentPath(pathname, routes.studio.generateImage),
			hasUpdate: updates.image,
			href: routes.studio.generateImage,
			label: 'Image',
		},
		{
			current: isCurrentPath(pathname, routes.studio.generateGraphic),
			hasUpdate: updates.graphic,
			href: routes.studio.generateGraphic,
			label: 'Graphic',
		},
	] as const
	const studioSettingItems = [
		{
			current: isCurrentPath(pathname, routes.studio.mcp),
			hasUpdate: updates.mcp,
			href: routes.studio.mcp,
			label: 'MCP',
		},
		{
			current: isCurrentPath(pathname, routes.studio.review),
			hasUpdate: updates.review,
			href: routes.studio.review,
			label: 'Review',
		},
		{
			current: isCurrentPath(pathname, routes.studio.assets),
			hasUpdate: updates.assets,
			href: routes.studio.assets,
			label: 'Assets',
		},
	] as const
	const closeCompact = () => setCompactOpen(false)

	return (
		<NavigationHeader.Root>
			<NavigationHeader.Desktop>
				<NavigationHeader.Start>
					<NavigationHeader.Link
						current={pathname === routes.admin}
						href={routes.admin}
						label="Login"
					/>
				</NavigationHeader.Start>
				<NavigationHeader.Center aria-label="주요 메뉴">
					<NavigationHeader.SymbolLink href={routes.home} />
					<NavigationHeader.Separator />
					<NavigationHeader.Link {...guidelineItem} />
					<NavigationHeader.Separator />
					<NavigationHeader.LinkGroup
						aria-label="Studio 제작"
						items={studioCreationItems}
					/>
					<NavigationHeader.Separator />
					<NavigationHeader.LinkGroup
						aria-label="Studio 설정"
						items={studioSettingItems}
					/>
				</NavigationHeader.Center>
				<NavigationHeader.End>
					<NavigationHeader.SearchTrigger
						aria-label="가이드라인 검색"
						onClick={() => setSearchOpen((current) => !current)}
						open={searchOpen}
					/>
					<NavigationHeader.ChatTrigger />
				</NavigationHeader.End>
			</NavigationHeader.Desktop>

			<NavigationHeader.Compact>
				<NavigationHeader.CompactBar>
					<NavigationHeader.SymbolLink href={routes.home} />
					<NavigationHeader.CompactActions>
						<NavigationHeader.ChatTrigger projection="compact" />
						<NavigationHeader.SearchTrigger
							aria-label="가이드라인 검색"
							onClick={() => setSearchOpen((current) => !current)}
							open={searchOpen}
							projection="compact"
						/>
						<NavigationHeader.MenuTrigger
							aria-controls="navigation-header-compact-menu"
							aria-expanded={compactOpen}
							onClick={() => setCompactOpen((current) => !current)}
						/>
					</NavigationHeader.CompactActions>
				</NavigationHeader.CompactBar>
				{compactOpen && (
					<NavigationHeader.CompactBody id="navigation-header-compact-menu">
						<NavigationHeader.CompactContent aria-label="주요 메뉴">
							<NavigationHeader.CompactLinkGroup>
								<NavigationHeader.Link
									{...guidelineItem}
									onClick={closeCompact}
									surface="compact"
								/>
							</NavigationHeader.CompactLinkGroup>
							<NavigationHeader.CompactSeparator />
							<NavigationHeader.CompactLinkGroup>
								{studioCreationItems.map((item) => (
									<NavigationHeader.Link
										key={item.href}
										{...item}
										onClick={closeCompact}
										surface="compact"
									/>
								))}
							</NavigationHeader.CompactLinkGroup>
							<NavigationHeader.CompactSeparator />
							<NavigationHeader.CompactLinkGroup>
								{studioSettingItems.map((item) => (
									<NavigationHeader.Link
										key={item.href}
										{...item}
										onClick={closeCompact}
										surface="compact"
									/>
								))}
							</NavigationHeader.CompactLinkGroup>
							<NavigationHeader.CompactLinkGroup className="pt-6">
								<NavigationHeader.Link
									className="justify-center bg-muted"
									current={pathname === routes.admin}
									href={routes.admin}
									label="Login"
									onClick={closeCompact}
									surface="compact"
								/>
							</NavigationHeader.CompactLinkGroup>
						</NavigationHeader.CompactContent>
					</NavigationHeader.CompactBody>
				)}
			</NavigationHeader.Compact>

			<HeaderGuidelineSearchDialog
				chapters={guidelineChapters}
				onOpenChange={setSearchOpen}
				open={searchOpen}
			/>
		</NavigationHeader.Root>
	)
}

export type { NavigationHeaderUpdates }
