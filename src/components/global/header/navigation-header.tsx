'use client'

import { Chat, Menu, Search } from '@carbon/icons-react'
import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'
import Link from 'next/link'
import type * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const navigationHeaderLinkVariants = cva(
	'relative inline-flex shrink-0 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/30',
	{
		variants: {
			current: {
				false: 'text-muted-foreground',
				true: 'text-foreground',
			},
			surface: {
				compact: 'h-9 w-full justify-between',
				grouped: 'my-0.5 h-8 rounded-lg px-3',
				standalone: 'h-9 rounded-lg px-3',
			},
		},
		compoundVariants: [
			{
				className: 'hover:bg-muted hover:text-foreground',
				current: false,
				surface: 'grouped',
			},
			{
				className: 'bg-muted',
				current: true,
				surface: 'grouped',
			},
			{
				className: 'hover:bg-muted hover:text-foreground',
				current: false,
				surface: 'standalone',
			},
			{
				className: 'bg-muted',
				current: true,
				surface: 'standalone',
			},
		],
		defaultVariants: {
			current: false,
			surface: 'standalone',
		},
	},
)

const navigationHeaderLinkLabelVariants = cva('', {
	variants: {
		current: {
			false: null,
			true: null,
		},
		surface: {
			compact: 'rounded-lg px-3 py-2',
			grouped: null,
			standalone: null,
		},
	},
	compoundVariants: [
		{
			className: 'bg-muted text-foreground',
			current: true,
			surface: 'compact',
		},
	],
})

const navigationHeaderSearchTriggerVariants = cva('', {
	variants: {
		projection: {
			compact: 'size-9.5 rounded-xl bg-muted p-2 text-foreground hover:bg-muted/80',
			desktop:
				'h-9 w-46 justify-between rounded-lg bg-background pl-4 pr-2 text-muted-foreground hover:bg-muted hover:text-foreground',
		},
	},
	defaultVariants: { projection: 'desktop' },
})

const navigationHeaderChatTriggerVariants = cva('', {
	variants: {
		projection: {
			compact: 'size-9.5 rounded-xl bg-muted p-2 text-foreground hover:bg-muted/80',
			desktop: 'h-9 rounded-lg bg-background px-6 text-foreground shadow-sm hover:bg-muted',
		},
	},
	defaultVariants: { projection: 'desktop' },
})

type NavigationHeaderRootProps = React.ComponentProps<'header'>

function NavigationHeaderRoot({ className, ...props }: NavigationHeaderRootProps) {
	return (
		<header
			data-slot="navigation-header"
			className={cn('relative z-50 shrink-0 overflow-visible', className)}
			{...props}
		/>
	)
}

function NavigationHeaderDesktop({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-desktop"
			className={cn(
				'hidden h-(--global-header-height) grid-cols-3 items-center bg-background px-5 xl:grid',
				className,
			)}
			{...props}
		/>
	)
}

function NavigationHeaderCompact({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact"
			className={cn('flex flex-col xl:hidden', className)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactBar({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact-bar"
			className={cn(
				'flex h-[50px] shrink-0 items-center justify-between px-3 pt-3',
				className,
			)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactActions({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact-actions"
			className={cn('flex items-center gap-2', className)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactBody({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact-body"
			className={cn('flex shrink-0 items-start p-3', className)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactContent({ className, ...props }: React.ComponentProps<'nav'>) {
	return (
		<nav
			data-slot="navigation-header-compact-content"
			className={cn(
				'flex w-full flex-col gap-2 overflow-hidden rounded-3xl bg-card p-3',
				className,
			)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactLinkGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact-link-group"
			className={cn('flex w-full flex-col gap-1', className)}
			{...props}
		/>
	)
}

function NavigationHeaderCompactSeparator({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="navigation-header-compact-separator"
			className={cn('flex h-1 w-full items-center px-1', className)}
			{...props}
		>
			<Separator />
		</div>
	)
}

function NavigationHeaderStart({ className, ...props }: React.ComponentProps<'section'>) {
	return (
		<section
			data-slot="navigation-header-start"
			className={cn('flex items-center justify-self-start', className)}
			{...props}
		/>
	)
}

function NavigationHeaderCenter({ className, ...props }: React.ComponentProps<'nav'>) {
	return (
		<nav
			data-slot="navigation-header-center"
			className={cn('flex items-center gap-4 justify-self-center', className)}
			{...props}
		/>
	)
}

function NavigationHeaderEnd({ className, ...props }: React.ComponentProps<'section'>) {
	return (
		<section
			data-slot="navigation-header-end"
			className={cn('flex min-w-0 items-center justify-self-end gap-2', className)}
			{...props}
		/>
	)
}

type NavigationHeaderLinkProps = Omit<React.ComponentProps<typeof Link>, 'children' | 'className'> &
	VariantProps<typeof navigationHeaderLinkVariants> & {
		className?: string
		hasUpdate?: boolean
		label: string
	}

function NavigationHeaderLink({
	className,
	current = false,
	hasUpdate = false,
	label,
	surface = 'standalone',
	...props
}: NavigationHeaderLinkProps) {
	return (
		<Link
			data-slot="navigation-header-link"
			data-surface={surface}
			aria-current={current ? 'page' : undefined}
			className={cn(navigationHeaderLinkVariants({ current, surface }), className)}
			{...props}
		>
			<Typography
				as="span"
				className={navigationHeaderLinkLabelVariants({ current, surface })}
				size="sm"
				weight="medium"
			>
				{label}
			</Typography>
			{hasUpdate && (
				<Badge
					className={cn(
						'pointer-events-none h-4.5 py-0 leading-none',
						surface === 'compact' ? 'px-1' : 'px-1.5',
						surface !== 'compact' && 'absolute left-1/2 -translate-x-1/2',
						surface === 'grouped' && 'top-10',
						surface === 'standalone' && 'top-10.5',
					)}
				>
					Update
				</Badge>
			)}
		</Link>
	)
}

type NavigationHeaderLinkItem = {
	current?: boolean
	hasUpdate?: boolean
	href: React.ComponentProps<typeof Link>['href']
	label: string
}

type NavigationHeaderLinkGroupProps = Omit<React.ComponentProps<'div'>, 'children'> & {
	items: readonly NavigationHeaderLinkItem[]
}

function NavigationHeaderLinkGroup({ className, items, ...props }: NavigationHeaderLinkGroupProps) {
	return (
		<div
			data-slot="navigation-header-link-group"
			className={cn('flex h-9 items-start', className)}
			{...props}
		>
			{items.map((item) => (
				<NavigationHeaderLink key={String(item.href)} surface="grouped" {...item} />
			))}
		</div>
	)
}

function NavigationHeaderSymbolLink({
	className,
	...props
}: Omit<React.ComponentProps<typeof Link>, 'children'>) {
	return (
		<Link
			data-slot="navigation-header-symbol-link"
			aria-label="메인으로 이동"
			className={cn(
				'flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/30',
				className,
			)}
			{...props}
		>
			<Image
				alt=""
				className="size-3.5 dark:brightness-0"
				height={14}
				src="/logos/logo.svg"
				width={14}
			/>
		</Link>
	)
}

function NavigationHeaderSeparator({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div data-slot="navigation-header-separator" className={cn('h-6', className)} {...props}>
			<Separator orientation="vertical" />
		</div>
	)
}

type NavigationHeaderSearchTriggerProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
	label?: string
	open: boolean
	projection?: 'compact' | 'desktop'
	shortcut?: readonly string[]
}

function NavigationHeaderSearchTrigger({
	className,
	label = 'Search',
	open,
	projection = 'desktop',
	shortcut = ['⌘', 'K'],
	...props
}: NavigationHeaderSearchTriggerProps) {
	return (
		<Button
			data-slot="navigation-header-search-trigger"
			aria-expanded={open}
			aria-haspopup="dialog"
			variant="ghost"
			className={cn(navigationHeaderSearchTriggerVariants({ projection }), className)}
			{...props}
		>
			{projection === 'compact' ? (
				<Search aria-hidden data-icon="only" className="size-5.5" />
			) : (
				<>
					<Typography as="span" size="sm" weight="medium">
						{label}
					</Typography>
					<KbdGroup className="gap-0.5">
						{shortcut.map((key) => (
							<Kbd className="size-6 rounded-md bg-muted px-1" key={key}>
								{key}
							</Kbd>
						))}
					</KbdGroup>
				</>
			)}
		</Button>
	)
}

type NavigationHeaderChatTriggerProps = Omit<
	React.ComponentProps<typeof SidebarTrigger>,
	'children'
> & {
	projection?: 'compact' | 'desktop'
}

function NavigationHeaderChatTrigger({
	className,
	projection = 'desktop',
	...props
}: NavigationHeaderChatTriggerProps) {
	return (
		<SidebarTrigger
			data-slot="navigation-header-chat-trigger"
			aria-label="Chat"
			className={cn(navigationHeaderChatTriggerVariants({ projection }), className)}
			{...props}
		>
			{projection === 'compact' ? (
				<Chat aria-hidden data-icon="only" className="size-5.5" />
			) : (
				'Chat'
			)}
		</SidebarTrigger>
	)
}

function NavigationHeaderMenuTrigger({
	className,
	...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>) {
	return (
		<Button
			data-slot="navigation-header-menu-trigger"
			aria-label="메뉴"
			variant="muted"
			className={cn('size-9.5 rounded-xl p-2 text-foreground', className)}
			{...props}
		>
			<Menu aria-hidden data-icon="only" className="size-5.5" />
		</Button>
	)
}

const NavigationHeader = {
	Center: NavigationHeaderCenter,
	ChatTrigger: NavigationHeaderChatTrigger,
	Compact: NavigationHeaderCompact,
	CompactActions: NavigationHeaderCompactActions,
	CompactBar: NavigationHeaderCompactBar,
	CompactBody: NavigationHeaderCompactBody,
	CompactContent: NavigationHeaderCompactContent,
	CompactLinkGroup: NavigationHeaderCompactLinkGroup,
	CompactSeparator: NavigationHeaderCompactSeparator,
	Desktop: NavigationHeaderDesktop,
	End: NavigationHeaderEnd,
	Link: NavigationHeaderLink,
	LinkGroup: NavigationHeaderLinkGroup,
	MenuTrigger: NavigationHeaderMenuTrigger,
	Root: NavigationHeaderRoot,
	SearchTrigger: NavigationHeaderSearchTrigger,
	Separator: NavigationHeaderSeparator,
	Start: NavigationHeaderStart,
	SymbolLink: NavigationHeaderSymbolLink,
}

export { NavigationHeader }
