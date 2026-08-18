'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/global/sidebar/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { scrollToGuidelinePage, useActivePageSlug } from './guideline-page-navigation'
import { getGuidelineSectionPages } from './guideline-section-pages'

/**
 * 좌측 가이드라인 탐색 — chapter → section → 현재 section의 page 앵커를 표시한다.
 * 🔴 **이것이 유일한 목차다.** 우측에 따로 있던 "On this page"는 2026-08-18에 지웠다 —
 *    같은 page 앵커를 같은 scroll-spy(`guideline-page-navigation`)로 두 곳에 그리고 있었다.
 */
export function GuidelineSideNavigation({
	chapters,
}: {
	chapters: GetGuidelineNavigationOutput['chapters']
}) {
	const pathname = usePathname()
	const currentSection = chapters
		.flatMap((chapter) => chapter.sections)
		.find((section) => pathname === section.href || pathname.startsWith(`${section.href}/`))
	const currentPages = currentSection ? getGuidelineSectionPages(currentSection) : []
	const activeSlug = useActivePageSlug(currentPages.map((page) => page.href.split('#')[1] ?? ''))

	return (
		<Sidebar.Root
			aria-label="가이드라인 목차"
			className="md:w-[265px]"
			data-slot="guideline-side-navigation"
		>
			<Sidebar.Content>
				<Sidebar.Group>
					{chapters.map((chapter) => {
						const chapterCurrent = pathname === chapter.href

						return (
							<Sidebar.Item
								key={chapter.id}
								current={chapterCurrent}
								depth={0}
								href={chapter.href}
								label={chapter.title}
								tone={chapterCurrent ? 'emphasized' : 'subtle'}
							>
								<Sidebar.Children>
									{chapter.sections.map((section) => {
										const sectionActive =
											pathname === section.href ||
											pathname.startsWith(`${section.href}/`)
										const pages = getGuidelineSectionPages(section)

										return (
											<Sidebar.Item
												key={section.id}
												current={sectionActive && !activeSlug}
												depth={1}
												href={section.href}
												label={section.title}
												tone={sectionActive ? 'emphasized' : 'subtle'}
											>
												{sectionActive && pages.length > 0 && (
													<Sidebar.Children>
														{pages.map((page) => {
															const slug =
																page.href.split('#')[1] ?? ''
															const pageCurrent = slug === activeSlug

															return (
																<Sidebar.Item
																	key={page.id}
																	aria-current={
																		pageCurrent
																			? 'location'
																			: undefined
																	}
																	current={pageCurrent}
																	depth={2}
																	href={page.href}
																	label={page.title}
																	onClick={(event) =>
																		scrollToGuidelinePage(
																			event,
																			slug,
																		)
																	}
																	tone={
																		pageCurrent
																			? 'emphasized'
																			: 'subtle'
																	}
																/>
															)
														})}
													</Sidebar.Children>
												)}
											</Sidebar.Item>
										)
									})}
								</Sidebar.Children>
							</Sidebar.Item>
						)
					})}
				</Sidebar.Group>
			</Sidebar.Content>
		</Sidebar.Root>
	)
}
