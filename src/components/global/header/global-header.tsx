'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
	GuidelineSearch,
	type GuidelineSearchChapter,
} from '@/components/global/search/guideline-search'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { HeaderPageNavigation } from './header-page-navigation'

function HeaderTail({
	className,
	guidelineChapters,
}: {
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<section className={className}>
			<GuidelineSearch chapters={guidelineChapters} />
			<SidebarTrigger variant="outline" size="default" className="p-3 py-4 rounded-full">
				Ask AI
			</SidebarTrigger>
		</section>
	)
}

function HeaderHead({ className }: { className?: string }) {
	const LOGO_SIZE = 14
	return (
		<section className={className}>
			<Link
				aria-label="메인으로 이동"
				className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-60"
				href="/"
			>
				<Image
					alt=""
					className="size-3.5 brightness-0 dark:invert"
					height={LOGO_SIZE}
					src="/logos/logo.svg"
					width={LOGO_SIZE}
				/>
			</Link>
		</section>
	)
}

export function GlobalHeader({
	guidelineChapters,
}: {
	guidelineChapters: GuidelineSearchChapter[]
}) {
	const [activeMenu, setActiveMenu] = useState('')

	return (
		<>
			<header className="relative z-50 grid shrink-0 grid-cols-3 items-center border-b border-border bg-background">
				<HeaderHead className="justify-self-start p-2 px-4" />
				<HeaderPageNavigation
					activeMenu={activeMenu}
					// Font Size & Weight Controlled
					className="grid place-items-center justify-self-center text-base font-normal"
					guidelineChapters={guidelineChapters}
					onActiveMenuChange={setActiveMenu}
				/>
				<HeaderTail
					className="flex min-w-0 items-center justify-self-end gap-2 p-2 px-4"
					guidelineChapters={guidelineChapters}
				/>
			</header>
			<button
				aria-hidden={!activeMenu}
				aria-label="메뉴 닫기"
				className="pointer-events-none fixed inset-0 z-40 cursor-default border-0 bg-background/60 p-0 opacity-0 backdrop-blur-sm transition-opacity duration-150 data-[open=true]:pointer-events-auto data-[open=true]:opacity-100"
				data-open={Boolean(activeMenu)}
				disabled={!activeMenu}
				onClick={() => setActiveMenu('')}
				tabIndex={-1}
				type="button"
			/>
		</>
	)
}
