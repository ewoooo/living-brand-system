import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import { GuidelineBlocks } from '../../blocks/renderers'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
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
			{/* Payload Preview Functions */}
			{previewDocumentId !== undefined && <RefreshRouteOnSave />}
			{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}
			<GuidelineContentFrame>
				{/* Deprecated */}
				<GuidelineHeaderImage image={section.headerImage} />
			</GuidelineContentFrame>

			{/*Guideline Section*/}
			<section className="flex flex-col gap-16" aria-label="guideline-section">
				{/* Guideline Section */}
				<section className="grid grid-rows-[auto_1fr]">
					<GuidelineContentFrame>
						<hgroup className="grid grid-cols-2 gap-4">
							<GuidelineHeader variant={variant} title={section.title} />
							<GuidelineDescription
								variant={variant}
								description={section.description}
							/>
						</hgroup>
					</GuidelineContentFrame>
					{/* Guideline Section Contents */}
					<GuidelineBlocks
						blocks={section.blocks}
						betterEditor={previewDocumentId !== undefined && !previewedPage}
					/>
				</section>
				{/* Guideline Page Render*/}
				<section className="flex flex-col gap-14" aria-label="guideline-pages">
					{section.pages.map((page) => (
						<GuidelinePage
							key={page.id}
							page={page}
							betterEditor={page.id === previewDocumentId}
						/>
					))}
				</section>
			</section>
		</article>
	)
}
