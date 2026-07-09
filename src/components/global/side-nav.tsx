'use client'

import { ChevronDown } from '@carbon/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'

/**
 * 사이트 공통 사이드 nav — 그룹(섹션/카테고리/챕터)마다 제목 + 항목 리스트.
 * guideline·review·create가 모두 이 하나를 쓴다. nav를 쓰는 페이지는 이 형태를 따른다.
 * href가 '#'로 시작하면 앵커(<a>), 아니면 라우트(<Link>)로 렌더하고 현재 경로면 활성 표시한다.
 */

export interface SideNavItem {
	key: string | number
	label: string
	href: string
	children?: SideNavItem[]
}

export interface SideNavGroup {
	key: string | number
	/** 그룹 제목. 없으면 제목 없이 항목만 렌더한다(평면 목차용). */
	title?: string
	/** 제목 자체를 이동 링크로 만들 때. 없으면 라벨로만 표시. */
	titleHref?: string
	items: SideNavItem[]
}

export interface SideNavInput {
	groups: SideNavGroup[]
	/** 그룹이 없을 때 표시할 안내 문구. */
	emptyText?: string
}

function isAnchor(href: string) {
	return href.startsWith('#')
}

function SideNavGroup({ group, pathname }: { group: SideNavGroup; pathname: string }) {
	return (
		<SidebarGroup>
			<SideNavGroupTitle group={group} />
			<SidebarGroupContent>
				<SidebarMenu>
					{group.items.map((item) => (
						<SideNavItem key={item.key} item={item} pathname={pathname} />
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}

function SideNavGroupTitle({ group }: { group: SideNavGroup }) {
	if (!group.title) return null
	const className = 'font-medium text-sidebar-foreground'

	if (group.titleHref) {
		return (
			<SidebarGroupLabel asChild className={className}>
				<Link href={group.titleHref}>{group.title}</Link>
			</SidebarGroupLabel>
		)
	}
	return <SidebarGroupLabel className={className}>{group.title}</SidebarGroupLabel>
}

function SideNavItem({
	item,
	pathname,
	nested = false,
}: {
	item: SideNavItem
	pathname: string
	nested?: boolean
}) {
	const active = pathname === item.href
	const children = item.children ?? []
	const hasChildren = !nested && children.length > 0
	const [open, setOpen] = useState(active)

	useEffect(() => {
		if (active) setOpen(true)
	}, [active])

	if (nested) {
		return (
			<SidebarMenuSubItem>
				<SideNavLink item={item} active={active} nested />
			</SidebarMenuSubItem>
		)
	}

	if (hasChildren) {
		return (
			<SidebarMenuItem>
				<Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton
							className={getSideNavLinkClassName(false)}
							isActive={active}
							size="sm"
						>
							<span>{item.label}</span>
							<ChevronDown
								className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
								data-icon="inline-end"
							/>
						</SidebarMenuButton>
					</CollapsibleTrigger>
					<CollapsibleContent className="side-nav-collapsible-content">
						<SidebarMenuSub className="mx-0 mb-0 gap-0 border-l-0 py-0 pr-0 pl-3">
							{children.map((child) => (
								<SideNavItem
									key={child.key}
									item={child}
									pathname={pathname}
									nested
								/>
							))}
						</SidebarMenuSub>
					</CollapsibleContent>
				</Collapsible>
			</SidebarMenuItem>
		)
	}

	return (
		<SidebarMenuItem>
			<SideNavLink item={item} active={active} nested={false} />
		</SidebarMenuItem>
	)
}

function getSideNavLinkClassName(nested: boolean) {
	return nested
		? 'text-sidebar-foreground/40 data-active:text-sidebar-foreground'
		: 'text-sidebar-foreground/65 data-active:text-sidebar-foreground'
}

function SideNavLink({
	item,
	active,
	nested,
}: {
	item: SideNavItem
	active: boolean
	nested: boolean
}) {
	const Button = nested ? SidebarMenuSubButton : SidebarMenuButton
	const className = getSideNavLinkClassName(nested)

	if (isAnchor(item.href)) {
		return (
			<Button asChild className={className} isActive={active} size="sm">
				<a href={item.href}>
					<span>{item.label}</span>
				</a>
			</Button>
		)
	}

	return (
		<Button asChild className={className} isActive={active} size="sm">
			<Link href={item.href} aria-current={active ? 'page' : undefined}>
				<span>{item.label}</span>
			</Link>
		</Button>
	)
}

export function SideNav({ groups, emptyText = '페이지 없음' }: SideNavInput) {
	const pathname = usePathname()

	return (
		<Sidebar collapsible="none" className="h-full pl-6">
			<SidebarContent className="pt-12">
				{groups.length > 0 ? (
					groups.map((group) => (
						<SideNavGroup key={group.key} group={group} pathname={pathname} />
					))
				) : (
					<SidebarGroup>
						<SidebarGroupLabel>{emptyText}</SidebarGroupLabel>
					</SidebarGroup>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
