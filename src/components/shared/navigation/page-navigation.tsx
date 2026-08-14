'use client'

import { ArrowLeft, ArrowRight } from '@carbon/icons-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

import { ContentFrame } from '@/components/shared/content-frame'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
} from '@/components/ui/pagination'

export interface PageNavigationItem {
	title: string
	href: string
	/** 챕터 카드와 같은 아이콘을 붙이기 위한 슬롯. 없으면 화살표만 남는다. */
	icon?: ReactNode
}

type PageNavigationProps = {
	items: PageNavigationItem[]
	unitLabel?: string
}

export function PageNavigation({ items, unitLabel = '페이지' }: PageNavigationProps) {
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
			className="min-h-48 border-border border-t bg-background text-foreground"
		>
			{/*
			 * 위 경계선은 전체 폭, 버튼은 본문과 같은 최대 폭 안에서 절반씩 — Carbon NextPrevious의
			 * 구조와 같다(바깥이 전체 폭, `.grid`가 max-width, 그 안을 두 열로 나눔).
			 * ContentFrame은 최대 폭과 가운데 정렬만 쓰고 여백은 링크가 갖는다: 그래야 hover 면이
			 * 반쪽 전체를 덮으면서 글자는 본문 텍스트와 같은 자리에서 시작한다.
			 * 🔴 `md:px-0`을 같이 줘야 한다 — tailwind-merge는 `px-0`(기본)과 `md:px-8`(md 변형)을
			 * 다른 것으로 보아 `px-0`만으로는 프레임의 `md:px-8`이 살아남고 데스크톱에서만 32px 어긋난다.
			 */}
			<ContentFrame className="px-0 py-0 md:px-0">
				<PaginationContent className="grid h-full w-full grid-cols-2 gap-0 divide-x divide-border">
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
			</ContentFrame>
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
				className="group/page-link h-full w-full flex-col items-start justify-start gap-2 whitespace-normal rounded-none px-4 py-8 text-left text-foreground transition-colors hover:bg-accent hover:text-foreground md:px-8 md:py-12"
			>
				<span className="text-muted-foreground text-sm">{label}</span>
				<span className="text-balance text-2xl">{item.title}</span>
				{/*
				 * 챕터 카드(NavigationBlock)의 꼬리와 같은 구성 — 아이콘 + 화살표.
				 * 다만 방향을 읽히게 하려고 이전은 화살표가 왼쪽, 다음은 오른쪽에 선다.
				 * 두 컴포넌트를 합치지 않고 어휘만 맞춘 실험이다(주목성 비교).
				 */}
				<div className="mt-auto flex w-full items-center gap-2 pt-4">
					{isPrevious ? (
						<>
							<ArrowLeft aria-hidden size={24} />
							<span className="ml-auto">{item.icon}</span>
						</>
					) : (
						<>
							{item.icon}
							<ArrowRight aria-hidden className="ml-auto" size={24} />
						</>
					)}
				</div>
			</PaginationLink>
		</PaginationItem>
	)
}
