'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
	const content = (
		<>
			<SideNavLink item={item} active={pathname === item.href} nested={nested} />
			{!nested && item.children && item.children.length > 0 && (
				<SidebarMenuSub>
					{item.children.map((child) => (
						<SideNavItem key={child.key} item={child} pathname={pathname} nested />
					))}
				</SidebarMenuSub>
			)}
		</>
	)

	if (nested) {
		return <SidebarMenuSubItem>{content}</SidebarMenuSubItem>
	}

	return <SidebarMenuItem>{content}</SidebarMenuItem>
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
	const className = nested
		? 'text-sidebar-foreground/60 data-active:text-sidebar-foreground'
		: 'text-sidebar-foreground/75 data-active:text-sidebar-foreground'

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
