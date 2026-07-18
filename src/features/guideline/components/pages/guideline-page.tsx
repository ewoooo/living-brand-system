import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/guideline-blocks'
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
		<article id={page.slug} className="mb-40 flex flex-col gap-16">
			<div className="grid grid-cols-2">
				<section className="flex flex-col gap-8 order-2 col-start-2">
					<GuidelineHeader variant={variant} title={page.title} />
					<GuidelineDescription variant={variant} description={page.description} />
				</section>
			</div>
			<GuidelineBlocks blocks={page.blocks} betterEditor={betterEditor} />
		</article>
	)
}
