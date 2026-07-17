import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/guideline-blocks'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineDescriptionFallback } from '../guideline-content-fallbacks'
import { RefreshRouteOnSave } from '../refresh-route-on-save'
import { ScrollToPreviewDocument } from '../scroll-to-preview-document'
import { GuidelinePage } from './guideline-page'

export function GuidelineSection({
	section,
	previewDocumentId,
}: {
	section: GetGuidelineSectionOutput
	previewDocumentId?: number
}) {
	const variant = 'section' satisfies GuidelineVariant
	const previewedPage = section.pages.find((page) => page.id === previewDocumentId)

	return (
		<article className="w-full">
			{previewDocumentId !== undefined && <RefreshRouteOnSave />}
			{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}
			<GuidelineHeader variant={variant} title={section.title} image={section.headerImage} />
			<div className="mt-8 mb-10">
				{section.description ? (
					<section className="grid gap-4 md:grid-cols-2">
						<p className="font-body font-normal text-base md:col-start-2">
							{section.description}
						</p>
					</section>
				) : (
					<GuidelineDescriptionFallback variant={variant} />
				)}
			</div>
			<GuidelineBlocks
				blocks={section.blocks}
				betterEditor={previewDocumentId !== undefined && !previewedPage}
			/>
			<section className="mb-16">
				{section.pages.map((page) => (
					<GuidelinePage
						key={page.id}
						page={page}
						betterEditor={page.id === previewDocumentId}
					/>
				))}
			</section>
		</article>
	)
}
