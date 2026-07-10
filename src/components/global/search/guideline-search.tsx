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
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

export type GuidelineSearchChapter = GetGuidelineNavigationOutput['chapters'][number]

export function GuidelineSearch({ chapters }: { chapters: GuidelineSearchChapter[] }) {
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
				variant="secondary"
				className="py-4 pl-3"
				onClick={() => setOpen((current) => !current)}
			>
				<span className="pr-8 text-neutral-500">가이드라인 검색...</span>
				<KbdGroup>
					<Kbd className="bg-neutral-500/10">⌘</Kbd>
					<Kbd className="bg-neutral-500/10">K</Kbd>
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
