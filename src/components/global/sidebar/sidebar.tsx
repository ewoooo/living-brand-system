import type { CarbonIconType } from '@carbon/icons-react'
import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import type * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger as SidebarPrimitiveTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const sidebarItemVariants = cva(
	'flex h-9 w-full items-center justify-center rounded-lg p-0 text-sm font-normal outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 md:max-xl:justify-center xl:group-data-[collapsed=false]/sidebar-api:justify-between xl:group-data-[collapsed=false]/sidebar-api:px-2 [&_svg]:size-5 [&_svg]:shrink-0',
	{
		variants: {
			current: {
				false: 'hover:bg-muted hover:text-foreground',
				true: 'hover:bg-muted hover:text-foreground active:bg-muted data-active:bg-muted data-active:text-foreground data-active:font-normal',
			},
			tone: {
				default: 'text-foreground',
				muted: 'text-muted-foreground',
			},
		},
		compoundVariants: [
			{
				className: 'data-active:text-foreground',
				current: true,
				tone: 'muted',
			},
		],
		defaultVariants: {
			current: false,
			tone: 'default',
		},
	},
)

type SidebarRootProps = Omit<React.ComponentProps<'aside'>, 'aria-label'> & {
	'aria-label': string
	collapsed?: boolean
}

function SidebarRoot({
	'aria-label': ariaLabel,
	children,
	className,
	collapsed = false,
	...props
}: SidebarRootProps) {
	return (
		<aside
			data-slot="sidebar-root"
			data-collapsed={collapsed}
			className={cn(
				'group/sidebar-api relative hidden h-full w-[100px] shrink-0 overflow-hidden bg-transparent p-4 transition-[width] duration-200 ease-linear motion-reduce:transition-none md:block xl:data-[collapsed=false]:w-[265px]',
				className,
			)}
			{...props}
		>
			<nav
				aria-label={ariaLabel}
				className="flex w-full flex-col gap-2 overflow-hidden rounded-xl bg-background p-4 text-foreground shadow-lg transition-[padding] duration-200 ease-linear motion-reduce:transition-none xl:group-data-[collapsed=false]/sidebar-api:p-3"
			>
				{children}
			</nav>
		</aside>
	)
}

function SidebarGroup({ className, ...props }: React.ComponentProps<typeof SidebarMenu>) {
	return <SidebarMenu data-slot="sidebar-group" className={cn('gap-1', className)} {...props} />
}

type SidebarItemProps = Omit<React.ComponentProps<typeof Link>, 'children' | 'className'> &
	VariantProps<typeof sidebarItemVariants> & {
		badge?: React.ReactNode
		icon?: CarbonIconType
		label: string
	}

function SidebarItem({
	badge,
	current = false,
	href,
	icon: Icon,
	label,
	tone = 'default',
	...props
}: SidebarItemProps) {
	return (
		<SidebarMenuItem data-slot="sidebar-item" data-tone={tone}>
			<SidebarMenuButton
				asChild
				isActive={current ?? false}
				tooltip={label}
				className={sidebarItemVariants({ current, tone })}
			>
				<Link
					data-slot="sidebar-item-link"
					href={href}
					aria-current={current ? 'page' : undefined}
					title={label}
					{...props}
				>
					<span className="truncate md:max-xl:sr-only xl:group-data-[collapsed=true]/sidebar-api:sr-only">
						{label}
					</span>
					{(badge || Icon) && (
						<span className="flex shrink-0 items-center gap-1 md:max-xl:[&_[data-slot=badge]]:hidden xl:group-data-[collapsed=true]/sidebar-api:[&_[data-slot=badge]]:hidden">
							{badge && <Badge>{badge}</Badge>}
							{Icon && <Icon aria-hidden data-icon="inline-end" />}
						</span>
					)}
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}

function SidebarSeparator() {
	return (
		<div data-slot="sidebar-separator" className="flex h-1 items-center">
			<Separator />
		</div>
	)
}

function SidebarTrigger({
	className,
	...props
}: React.ComponentProps<typeof SidebarPrimitiveTrigger>) {
	return (
		<SidebarPrimitiveTrigger
			data-slot="sidebar-collapse-trigger"
			aria-label="사이드바 접기 또는 펼치기"
			title="사이드바 접기 또는 펼치기"
			className={cn(
				'absolute inset-y-0 right-0 h-full w-2 rounded-none p-0 opacity-0 hover:bg-muted hover:opacity-100 focus-visible:opacity-100',
				className,
			)}
			{...props}
		/>
	)
}

const Sidebar = {
	Group: SidebarGroup,
	Item: SidebarItem,
	Root: SidebarRoot,
	Separator: SidebarSeparator,
	Trigger: SidebarTrigger,
}

export { Sidebar, sidebarItemVariants }
