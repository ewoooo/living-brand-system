'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

export type GuidelineSearchChapter = GetGuidelineNavigationOutput['chapters'][number]

function HeaderGuidelineSearch({ chapters }: { chapters: GuidelineSearchChapter[] }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				const target = (event.target ?? document.activeElement) as HTMLElement | null
				const tagName = target?.tagName
				if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) {
					return
				}
				event.preventDefault()
				setOpen((current) => !current)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<Button
				aria-label="가이드라인 검색"
				variant="muted"
				shape="rounded"
				className="py-4 pl-3 min-h-6"
				onClick={() => setOpen((current) => !current)}
			>
				<span className="pr-6 text-sm font-normal text-muted-foreground">Search</span>
				<KbdGroup>
					<Kbd className="border border-border bg-transparent">⌘</Kbd>
					<Kbd className="border border-border bg-transparent">K</Kbd>
				</KbdGroup>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen} title="가이드라인 검색">
				<Command>
					<CommandInput placeholder="가이드라인 페이지 검색..." />
					<CommandList>
						<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
						{chapters.map((chapter) => (
							<CommandGroup heading={chapter.title} key={chapter.id}>
								{chapter.sections.map((section) => (
									<CommandItem
										key={section.id}
										value={`${chapter.title} ${section.title}`}
										onSelect={() => {
											setOpen(false)
											router.push(section.href)
										}}
									>
										<span>{section.title}</span>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	)
}

export function HeaderTail({
	className,
	guidelineChapters,
}: {
	className?: string
	guidelineChapters: GuidelineSearchChapter[]
}) {
	return (
		<section className={className}>
			<HeaderGuidelineSearch chapters={guidelineChapters} />
			<SidebarTrigger
				variant="highlight"
				shape="pill"
				size="default"
				className="p-4 py-4 min-h-6 border"
			>
				AI
			</SidebarTrigger>
		</section>
	)
}
