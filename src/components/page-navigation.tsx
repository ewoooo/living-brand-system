'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
} from '@/components/ui/pagination'

export interface PageNavigationItem {
	title: string
	href: string
}

export function PageNavigation({
	items,
	unitLabel = '페이지',
}: {
	items: PageNavigationItem[]
	unitLabel?: string
}) {
	const pathname = usePathname()
	const [hash, setHash] = useState('')

	useEffect(() => {
		const syncHash = () => setHash(window.location.hash)
		syncHash()
		window.addEventListener('hashchange', syncHash)
		return () => window.removeEventListener('hashchange', syncHash)
	}, [])

	const index = getPageNavigationIndex(items, pathname, hash)
	const previous = items[index - 1]
	const next = items[index + 1]

	if (index < 0 || (!previous && !next)) return null

	return (
		<Pagination
			aria-label={`${unitLabel} 이동`}
			className="min-h-48 bg-foreground-muted/20 text-background"
		>
			<PaginationContent className="grid w-full grid-cols-2 gap-0">
				{previous ? (
					<PageLink item={previous} direction="previous" unitLabel={unitLabel} />
				) : (
					<PaginationItem aria-hidden />
				)}
				{next ? (
					<PageLink item={next} direction="next" unitLabel={unitLabel} />
				) : (
					<PaginationItem aria-hidden />
				)}
			</PaginationContent>
		</Pagination>
	)
}

export function getPageNavigationIndex(
	items: PageNavigationItem[],
	pathname: string,
	hash: string,
) {
	const exactIndex = items.findIndex((item) => item.href === `${pathname}${hash}`)
	return exactIndex >= 0 ? exactIndex : items.findIndex((item) => item.href === pathname)
}

function PageLink({
	item,
	direction,
	unitLabel,
}: {
	item: PageNavigationItem
	direction: 'previous' | 'next'
	unitLabel: string
}) {
	const isPrevious = direction === 'previous'
	const label = isPrevious ? '이전' : '다음'

	return (
		<PaginationItem className="h-full">
			<PaginationLink
				href={item.href}
				rel={isPrevious ? 'prev' : 'next'}
				size="default"
				aria-label={`${label} ${unitLabel}: ${item.title}`}
				className="h-full w-full flex-col items-start justify-start gap-2 whitespace-normal rounded-none p-8 text-left text-background hover:bg-foreground/40 hover:text-background focus-visible:ring-background md:p-12"
			>
				<span className="text-sm opacity-70">{label}</span>
				<span className="text-balance text-2xl md:text-3xl">{item.title}</span>
			</PaginationLink>
		</PaginationItem>
	)
}
