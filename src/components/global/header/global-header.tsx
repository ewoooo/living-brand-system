'use client'

import { useState } from 'react'
import { HeaderCenter } from '@/components/global/header/header-center'
import { HeaderHead } from '@/components/global/header/header-head'
import { type GuidelineSearchChapter, HeaderTail } from '@/components/global/header/header-tail'

export function GlobalHeader({
	guidelineChapters,
}: {
	guidelineChapters: GuidelineSearchChapter[]
}) {
	const [activeMenu, setActiveMenu] = useState('')

	return (
		<>
			<header
				data-slot="global-header"
				className="relative z-50 grid shrink-0 grid-cols-3 items-center border-b border-border bg-background p-1 px-6 data-[open=true]:border-transparent"
				data-open={Boolean(activeMenu)}
			>
				<HeaderHead className="justify-self-start" />
				<HeaderCenter
					activeMenu={activeMenu}
					className="grid place-items-center justify-self-center"
					guidelineChapters={guidelineChapters}
					onActiveMenuChange={setActiveMenu}
				/>
				<HeaderTail
					className="flex min-w-0 items-center justify-self-end gap-2"
					guidelineChapters={guidelineChapters}
				/>
			</header>
			<button
				data-slot="global-header-backdrop"
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
