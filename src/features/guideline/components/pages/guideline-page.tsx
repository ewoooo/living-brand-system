import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import { GuidelineBlocks } from '../../blocks/renderers'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'

export function GuidelinePage({
	page,
	betterEditor = false,
}: {
	page: GetGuidelineSectionOutput['pages'][number]
	betterEditor?: boolean
}) {
	const variant = 'page' satisfies GuidelineVariant

	return (
		<article id={page.slug} className="flex flex-col">
			<GuidelineContentFrame>
				<div className="grid md:grid-cols-2">
					<section className="flex flex-col gap-8 order-2 col-start-2">
						<GuidelineHeader variant={variant} title={page.title} />
						<GuidelineDescription variant={variant} description={page.description} />
					</section>
				</div>
			</GuidelineContentFrame>
			<GuidelineBlocks blocks={page.blocks} betterEditor={betterEditor} />
		</article>
	)
}
