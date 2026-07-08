'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'

/**
 * 사이트 공통 사이드 nav — 그룹(섹션/카테고리/챕터)마다 제목 + 항목 리스트.
 * guideline·review·create가 모두 이 하나를 쓴다. nav를 쓰는 페이지는 이 형태를 따른다.
 * href가 '#'로 시작하면 앵커(<a>), 아니면 라우트(<Link>)로 렌더하고 현재 경로면 활성 표시한다.
 */

export interface SideNavItem {
	key: string | number
	label: string
	href: string
}

export interface SideNavGroup {
	key: string | number
	/** 그룹 제목. 없으면 제목 없이 항목만 렌더한다(평면 목차용). */
	title?: string
	/** 제목 자체를 이동 링크로 만들 때. 없으면 라벨로만 표시. */
	titleHref?: string
	items: SideNavItem[]
}

function isAnchor(href: string) {
	return href.startsWith('#')
}

function NavItem({ item, active }: { item: SideNavItem; active: boolean }) {
	const className = `block px-2 py-1.5 text-sm transition-colors ${
		active ? 'font-medium text-foreground' : 'text-neutral-500 hover:text-foreground'
	}`

	if (isAnchor(item.href)) {
		return (
			<a href={item.href} className={className}>
				{item.label}
			</a>
		)
	}

	return (
		<Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
			{item.label}
		</Link>
	)
}

function NavGroup({ group, pathname }: { group: SideNavGroup; pathname: string }) {
	return (
		<div className="px-2 py-2">
			{group.title &&
				(group.titleHref ? (
					<Link
						href={group.titleHref}
						className="block px-2 pb-1 font-medium text-foreground text-xs hover:text-foreground"
					>
						{group.title}
					</Link>
				) : (
					<div className="px-2 pb-1 font-medium text-foreground text-xs">
						{group.title}
					</div>
				))}
			<ul className="flex flex-col">
				{group.items.map((item) => (
					<li key={item.key}>
						<NavItem item={item} active={pathname === item.href} />
					</li>
				))}
			</ul>
		</div>
	)
}

export function SideNav({
	groups,
	emptyText = '페이지 없음',
}: {
	groups: SideNavGroup[]
	/** 그룹이 없을 때 표시할 안내 문구. */
	emptyText?: string
}) {
	const pathname = usePathname()

	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">
				{groups.length > 0 ? (
					groups.map((group) => (
						<NavGroup key={group.key} group={group} pathname={pathname} />
					))
				) : (
					<div className="px-4 py-2 text-neutral-400 text-xs">{emptyText}</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
