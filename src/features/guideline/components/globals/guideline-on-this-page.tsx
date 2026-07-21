'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

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
		<nav aria-label="이 페이지에서" className="font-body text-xs">
			<p className="mb-3 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
				On this page
			</p>
			<ul ref={listRef} className="relative ml-1 border-border border-l">
				{seg && (
					<span
						aria-hidden
						className="-translate-x-1/2 absolute left-0 w-0.5 rounded-full bg-foreground transition-all duration-200 ease-out"
						style={{ top: seg.top, height: seg.height }}
					/>
				)}
				{pages.map((page) => (
					<li key={page.id} data-slug={page.slug}>
						<a
							href={`#${page.slug}`}
							aria-current={page.slug === activeSlug ? 'page' : undefined}
							onClick={(event) => scrollToPage(event, page.slug)}
							className={cn(
								'block py-1.5 pl-3 leading-snug transition-colors',
								page.slug === activeSlug
									? 'font-semibold text-foreground'
									: 'font-normal text-muted-foreground hover:text-foreground',
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

/** 중첩 스크롤 컨테이너를 직접 움직인다(브라우저 기본 #앵커는 부모 프레임을 스크롤함). */
function scrollToPage(event: React.MouseEvent, slug: string) {
	const el = document.getElementById(slug)
	const root = el?.closest<HTMLElement>('[data-slot="section-scroll-container"]')
	if (!el || !root) return
	event.preventDefault()
	root.scrollTo({
		top:
			root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - 96,
		behavior: 'smooth',
	})
	history.replaceState(null, '', `#${slug}`)
}

/**
 * 스크롤 스파이 — 섹션 스크롤 컨테이너 상단 기준선을 넘어선 마지막 article slug를 active로 반환.
 */
function useActivePageSlug(slugs: string[]): string | null {
	const [active, setActive] = useState<string | null>(null)
	const key = slugs.join('|')

	useEffect(() => {
		const list = key ? key.split('|') : []
		if (list.length === 0) {
			setActive(null)
			return
		}
		const root = document.querySelector<HTMLElement>('[data-slot="section-scroll-container"]')
		if (!root) return

		let raf = 0
		const compute = () => {
			raf = 0
			const line = root.getBoundingClientRect().top + 120
			let current: string | null = null
			for (const slug of list) {
				const el = document.getElementById(slug)
				if (!el) continue
				if (el.getBoundingClientRect().top <= line) current = slug
				else break
			}
			setActive(current)
		}
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(compute)
		}

		compute()
		root.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onScroll, { passive: true })
		return () => {
			root.removeEventListener('scroll', onScroll)
			window.removeEventListener('resize', onScroll)
			if (raf) cancelAnimationFrame(raf)
		}
	}, [key])

	return active
}
