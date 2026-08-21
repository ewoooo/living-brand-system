import { ContentFrame } from '@/components/shared/content-frame'
import { cn } from '@/lib/utils'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import { surfaceScopeClass, surfaceStyle } from '../globals/guideline-surface'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineBlocks } from '../guideline-blocks'

export function GuidelinePage({
	page,
	betterEditor = false,
}: {
	page: GetGuidelineSectionOutput['pages'][number]
	betterEditor?: boolean
}) {
	const variant = 'page' satisfies GuidelineVariant

	return (
		// 🔴 여백은 **프레임 패딩 + 이 gap의 합**이다(docs/09 §7). 제목 프레임의 아래 패딩 32 +
		//    gap 48 = 80 — Figma(61:3376) Article 안의 제목→배치 간격과 같다. 블록은 자기 면을
		//    프레임 가장자리까지 칠하므로 그쪽 패딩은 여백에 더해지지 않는다(실측).
		//
		// 🔴 문서의 면은 여기서 칠한다 — Figma(61:3299)의 Article 면은 제목·본문까지 덮는다.
		//    블록이 자기 면을 갖고 있지만 그것은 배치 영역에서 끊기므로 이 자리를 대신 못 한다.
		<article
			id={page.slug}
			className={cn(
				'flex flex-col gap-12',
				surfaceScopeClass(page.background, page.backgroundTone),
			)}
			style={surfaceStyle(page.background, page.backgroundTone)}
		>
			<ContentFrame>
				<div className="grid md:grid-cols-2">
					<section className="flex flex-col gap-8 order-2 col-start-2">
						<GuidelineHeader variant={variant} title={page.title} />
						<GuidelineDescription variant={variant} description={page.description} />
					</section>
				</div>
			</ContentFrame>
			<GuidelineBlocks blocks={page.blocks} betterEditor={betterEditor} />
		</article>
	)
}
