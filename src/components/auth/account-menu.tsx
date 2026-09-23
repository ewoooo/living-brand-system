'use client'

import { Logout, UserAvatar } from '@carbon/icons-react'
import Link from 'next/link'
import { DropdownMenu } from 'radix-ui'
import { Typography } from '@/components/ui/typography'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

const ITEM_CLASS =
	'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none data-highlighted:bg-foreground/5'

/**
 * 헤더의 계정 유틸 — 아이콘이 아니라 **메뉴를 연다.**
 *
 * 🔑 Carbon Global header 패턴: 「Utility icons should not be used to directly navigate to an
 *    area. Instead, they should open a panel」. 그리고 「The header can be used to indicate the
 *    user's logged in status, **which account they are using**」 — 그래서 메뉴 머리에 이메일을 적는다.
 * 🔴 로그아웃을 헤더에 따로 꺼내지 않는다. 드물게 쓰는 행동에 전역 슬롯 하나를 통째로 주지 않는다.
 */
export function AccountMenu({ email }: { email: string }) {
	const { error, loading, logout } = useLogout()

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				aria-label={`계정 메뉴 — ${email}`}
				className="flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30 data-[state=open]:bg-foreground/5"
				data-slot="account-menu-trigger"
			>
				<UserAvatar aria-hidden size={16} />
				Account
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align="start"
					className="z-50 min-w-56 rounded-xl border border-border bg-background p-1 shadow-lg"
					data-slot="account-menu"
					sideOffset={6}
				>
					{/* 어느 계정으로 들어와 있는지 — Carbon의 「sense of place」가 요구하는 줄이다. */}
					<div className="px-2 pt-1.5 pb-2">
						<Typography className="block truncate" size="sm" tone="muted">
							{email}
						</Typography>
					</div>

					<DropdownMenu.Item asChild>
						<Link className={ITEM_CLASS} href={routes.account}>
							<UserAvatar aria-hidden size={16} />내 계정
						</Link>
					</DropdownMenu.Item>

					<DropdownMenu.Item
						aria-busy={loading || undefined}
						className={cn(ITEM_CLASS, 'text-destructive')}
						// 메뉴가 닫히면 진행 상태를 말할 자리가 사라진다 — 끝날 때까지 열어 둔다.
						onSelect={(event) => {
							event.preventDefault()
							logout()
						}}
					>
						<Logout aria-hidden size={16} />
						{loading ? '로그아웃 중…' : '로그아웃'}
					</DropdownMenu.Item>

					{error && (
						<Typography
							className="px-2 py-1.5"
							role="alert"
							size="sm"
							tone="destructive"
						>
							{error}
						</Typography>
					)}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
