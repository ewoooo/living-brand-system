'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface PageNavigationItem {
	title: string
	href: string
}

export function PageNavigation({ items }: { items: PageNavigationItem[] }) {
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
		<nav
			aria-label="페이지 이동"
			className="grid min-h-48 w-full grid-cols-2 bg-foreground text-background"
		>
			{previous ? <PageLink item={previous} direction="previous" /> : <span />}
			{next ? <PageLink item={next} direction="next" /> : <span />}
		</nav>
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
}: {
	item: PageNavigationItem
	direction: 'previous' | 'next'
}) {
	const isPrevious = direction === 'previous'
	const label = isPrevious ? '이전' : '다음'

	return (
		<Link
			href={item.href}
			rel={isPrevious ? 'prev' : 'next'}
			aria-label={`${label} 페이지: ${item.title}`}
			className="flex flex-col gap-2 p-8 transition-colors hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-background focus-visible:outline-offset-[-4px] md:p-12"
		>
			<span className="text-sm opacity-70">{label}</span>
			<span className="text-balance text-2xl md:text-3xl">{item.title}</span>
		</Link>
	)
}
