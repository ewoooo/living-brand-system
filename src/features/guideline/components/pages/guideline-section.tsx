import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/guideline-blocks'
import { GuidelineHeader } from '../globals/guideline-header'
import { GuidelineOnThisPage } from '../globals/guideline-on-this-page'
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
		<article className="grid w-full grid-rows-[auto_1fr]">
			{previewDocumentId !== undefined && <RefreshRouteOnSave />}
			{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}
			<div className="mb-10">
				<GuidelineHeader
					variant={variant}
					title={section.title}
					image={section.headerImage}
				/>
				{section.description ? (
					<section className="mt-8 grid gap-4 md:grid-cols-2">
						<p className="type-body md:col-start-2">{section.description}</p>
					</section>
				) : (
					<GuidelineDescriptionFallback variant={variant} />
				)}
			</div>
			<GuidelineOnThisPage pages={section.pages} />
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
