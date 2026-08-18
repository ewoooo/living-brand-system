'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { scrollToGuidelinePage, useActivePageSlug } from './guideline-page-navigation'

type TocPage = { id: number | string; slug: string; title: string }

/**
 * "On this page" 목차 — 섹션(=한 스크롤 페이지)의 하위 Page 앵커(`<article id={slug}>`)를
 * main 우상단에 sticky로 나열하고, 스크롤 위치에 따라 현재 보는 Page를 세로 레일 위 굵은
 * 인디케이터로 표시한다(scroll-spy). route가 아니라 in-page 앵커이므로 사이트 사이드바가 아니라
 * 여기(페이지 문맥)에 둔다.
 */
export function GuidelineOnThisPage({ pages }: { pages: TocPage[] }) {
	const activeSlug = useActivePageSlug(pages.map((p) => p.slug))

	const listRef = useRef<HTMLUListElement>(null)
	const [seg, setSeg] = useState<{ top: number; height: number } | null>(null)
	useEffect(() => {
		const list = listRef.current
		if (!list || !activeSlug) {
			setSeg(null)
			return
		}
		const row = list.querySelector<HTMLElement>(`[data-slug="${activeSlug}"]`)
		setSeg(row ? { top: row.offsetTop, height: row.offsetHeight } : null)
	}, [activeSlug])

	// 목차가 의미 있으려면 Page가 2개 이상.
	if (pages.length < 2) return null

	return (
		<nav aria-label="이 페이지에서" className="font-body text-sm">
			<p className="mb-3 font-medium text-xs text-current/60 uppercase tracking-wide">
				On this page
			</p>
			<ul ref={listRef} className="relative ml-1 border-current/40 border-l">
				{seg && (
					<span
						aria-hidden
						className="-translate-x-1/2 absolute left-0 w-0.5 rounded-full bg-current transition-all duration-200 ease-out"
						style={{ top: seg.top, height: seg.height }}
					/>
				)}
				{pages.map((page) => (
					<li key={page.id} data-slug={page.slug}>
						<a
							href={`#${page.slug}`}
							aria-current={page.slug === activeSlug ? 'page' : undefined}
							onClick={(event) => scrollToGuidelinePage(event, page.slug)}
							className={cn(
								'block py-1.5 pl-3 leading-snug transition-colors',
								page.slug === activeSlug
									? 'font-semibold text-current'
									: 'font-normal text-current/60 hover:text-current',
							)}
						>
							{page.title}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}
