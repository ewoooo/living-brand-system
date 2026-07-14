'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'

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
		<Pagination aria-label="페이지 이동">
			<PaginationContent>
				{previous ? (
					<PaginationItem>
						<PaginationPrevious
							href={previous.href}
							rel="prev"
							text={previous.title}
							aria-label={`이전 페이지: ${previous.title}`}
						/>
					</PaginationItem>
				) : null}
				{next ? (
					<PaginationItem>
						<PaginationNext
							href={next.href}
							rel="next"
							text={next.title}
							aria-label={`다음 페이지: ${next.title}`}
						/>
					</PaginationItem>
				) : null}
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
