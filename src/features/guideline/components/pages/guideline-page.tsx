import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/guideline-blocks'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineDescriptionFallback } from '../guideline-content-fallbacks'

export function GuidelinePage({ page }: { page: GetGuidelineSectionOutput['pages'][number] }) {
	const variant = 'page' satisfies GuidelineVariant

	return (
		<article id={page.slug} className="mb-40">
			<GuidelineHeader
				variant={variant}
				as="h2"
				title={page.title}
				label={page.displayOrder + 1}
			/>
			{page.description ? (
				<section className="mt-8 grid gap-4 md:grid-cols-2">
					<RichText
						data={page.description}
						className="space-y-0.5 leading-7 tracking-normal md:col-start-2"
					/>
				</section>
			) : (
				<GuidelineDescriptionFallback variant={variant} />
			)}
			<GuidelineBlocks blocks={page.blocks} />
		</article>
	)
}
