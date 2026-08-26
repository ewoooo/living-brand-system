import Image from 'next/image'
import Link from 'next/link'
import { ContentFrame } from '@/components/shared/content-frame'
import { PageHero } from '@/components/shared/page-hero'
import { PanelCard, PanelChip } from '@/components/shared/panel-card'
import { cn } from '@/lib/utils'
import type { GetGuidelineNavigationOutput } from '../../services/get-guideline-navigation.service'

/**
 * 챕터 카드의 배치(정본: Figma 89:1969) — 3열 그리드에서 챕터 순서대로
 * 1칸(낮은 카드) → 2칸(높은 카드) → 전폭 순으로 앉는다.
 * 챕터가 셋을 넘으면 같은 패턴을 반복한다. (ponytail: 정본이 3챕터 기준이라 그 이후는 순환)
 */
const CARD_LAYOUT = [
	{ card: 'md:col-span-1 min-h-75', list: 'flex flex-col items-start gap-1.5' },
	{
		card: 'md:col-span-2 min-h-150',
		list: 'grid grid-cols-1 justify-items-start gap-1.5 md:grid-cols-3',
	},
	{ card: 'md:col-span-3 min-h-150', list: 'flex flex-col items-start gap-1.5' },
] as const

export function GuidelineOnboard({ navigation }: { navigation: GetGuidelineNavigationOutput }) {
	const { title, chapters } = navigation

	return (
		<ContentFrame>
			<div className="flex flex-col gap-3">
				{/* 배경 사진 위 락업이므로 dark 스코프로 토큰을 뒤집는다(docs/09 §5) — 두 테마 모두에서 밝은 전경을 얻는다. */}
				<PageHero
					className="dark h-120 w-full"
					fallbackSrc="/images/hero_guideline.png"
					runtimeId="linear-fluted-glass"
				>
					<div className="flex items-center gap-6 text-foreground">
						<Image alt="HD" height={32} src="/logos/logo_wht.svg" width={77} />
						<div aria-hidden className="h-8 w-px bg-foreground/40" />
						{/* CI(32px)와 짝을 이루는 히어로 락업이라 UI 타이포그래피 단계를 따르지 않는다(docs/09 §6의 lockup 예외). */}
						<p className="font-medium text-[34px] leading-8">{title}</p>
					</div>
				</PageHero>

				<section className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
					{chapters.map((chapter, index) => {
						const layout = CARD_LAYOUT[index % CARD_LAYOUT.length] ?? CARD_LAYOUT[0]
						return (
							<PanelCard
								className={layout.card}
								key={chapter.id}
								title={chapter.title}
							>
								<ul className={cn('m-0 list-none p-0', layout.list)}>
									{chapter.topics.map((topic) => (
										<li key={topic.href}>
											<PanelChip
												asChild
												className="no-underline transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
											>
												<Link href={topic.href}>{topic.title}</Link>
											</PanelChip>
										</li>
									))}
								</ul>
							</PanelCard>
						)
					})}
				</section>
			</div>
		</ContentFrame>
	)
}
