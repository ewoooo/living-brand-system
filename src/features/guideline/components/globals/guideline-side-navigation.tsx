'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/global/sidebar/sidebar'
import { CopyPageLink } from '@/components/shared/copy-page-link'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { scrollToGuidelinePage, useActivePageSlug } from './guideline-page-navigation'
import { getGuidelineTopicPages } from './guideline-topic-pages'

/**
 * 좌측 가이드라인 탐색 — chapter → topic → 현재 topic의 page 앵커를 표시한다.
 * 🔴 **이것이 유일한 목차다.** 우측에 따로 있던 "On this page"는 2026-08-18에 지웠다 —
 *    같은 page 앵커를 같은 scroll-spy(`guideline-page-navigation`)로 두 곳에 그리고 있었다.
 */
export function GuidelineSideNavigation({
	chapters,
}: {
	chapters: GetGuidelineNavigationOutput['chapters']
}) {
	const pathname = usePathname()
	const currentTopic = chapters
		.flatMap((chapter) => chapter.topics)
		.find((topic) => pathname === topic.href || pathname.startsWith(`${topic.href}/`))
	const currentPages = currentTopic ? getGuidelineTopicPages(currentTopic) : []
	const activeSlug = useActivePageSlug(currentPages.map((page) => page.href.split('#')[1] ?? ''))

	return (
		<Sidebar.Root
			aria-label="가이드라인 목차"
			className="md:w-[265px]"
			data-slot="guideline-side-navigation"
			footer={<CopyPageLink />}
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
									{chapter.topics.map((topic) => {
										const topicActive =
											pathname === topic.href ||
											pathname.startsWith(`${topic.href}/`)
										const pages = getGuidelineTopicPages(topic)

										return (
											<Sidebar.Item
												key={topic.id}
												current={topicActive && !activeSlug}
												depth={1}
												href={topic.href}
												label={topic.title}
												tone={topicActive ? 'emphasized' : 'subtle'}
											>
												{topicActive && pages.length > 0 && (
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
