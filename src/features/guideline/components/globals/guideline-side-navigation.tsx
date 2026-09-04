'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/global/sidebar/sidebar'
import { CopyPageLink } from '@/components/shared/copy-page-link'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { scrollToGuidelineSection, useActiveSectionAnchor } from './guideline-section-navigation'

/**
 * 좌측 가이드라인 탐색 — chapter → topic → 현재 topic의 섹션 앵커를 표시한다.
 * 🔴 **이것이 유일한 목차다.** 우측에 따로 있던 "On this page"는 2026-08-18에 지웠다 —
 *    같은 앵커를 같은 scroll-spy(`guideline-section-navigation`)로 두 곳에 그리고 있었다.
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
	const currentSections = currentTopic?.sections ?? []
	const activeAnchor = useActiveSectionAnchor(currentSections.map((section) => section.anchor))

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
						// 🔴 챕터는 자기 화면이 없다(2026-08-26). 분류일 뿐이라 인덱스로 보낸다 —
						//    인덱스가 전 챕터의 카드와 토픽 칩을 이미 그린다.
						const chapterCurrent = pathname === '/guideline'

						return (
							<Sidebar.Item
								key={chapter.id}
								current={chapterCurrent}
								depth={0}
								href="/guideline"
								label={chapter.title}
								tone={chapterCurrent ? 'emphasized' : 'subtle'}
							>
								<Sidebar.Children>
									{chapter.topics.map((topic) => {
										const topicActive =
											pathname === topic.href ||
											pathname.startsWith(`${topic.href}/`)
										const { sections } = topic

										return (
											<Sidebar.Item
												key={topic.id}
												current={topicActive && !activeAnchor}
												depth={1}
												href={topic.href}
												label={topic.title}
												tone={topicActive ? 'emphasized' : 'subtle'}
											>
												{topicActive && sections.length > 0 && (
													<Sidebar.Children>
														{sections.map((section) => {
															const sectionCurrent =
																section.anchor === activeAnchor

															return (
																<Sidebar.Item
																	key={section.anchor}
																	aria-current={
																		sectionCurrent
																			? 'location'
																			: undefined
																	}
																	current={sectionCurrent}
																	depth={2}
																	href={section.href}
																	label={section.title}
																	onClick={(event) =>
																		scrollToGuidelineSection(
																			event,
																			section.anchor,
																		)
																	}
																	tone={
																		sectionCurrent
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
