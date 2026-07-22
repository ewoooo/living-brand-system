import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import { GuidelineOnThisPage } from '../globals/guideline-on-this-page'
import { getGuidelineSectionPages } from '../globals/guideline-section-pages'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineBlocks } from '../guideline-blocks'
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

	// 단일 Page(제목이 섹션과 같음)는 목차가 무의미 → 제외.
	const tocPages = getGuidelineSectionPages(section)
	const hasToc = tocPages.length >= 2

	return (
		<article className="relative w-full">
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

			{hasToc && (
				<div className="pointer-events-none absolute inset-0 mx-auto hidden w-full max-w-[1640px] px-6 xl:block">
					<aside className="absolute inset-y-0 right-6 w-48">
						<div className="pointer-events-auto sticky top-24 pt-16 text-background mix-blend-difference dark:text-foreground">
							<GuidelineOnThisPage
								pages={tocPages.map((page) => ({
									id: page.id,
									slug: page.slug,
									title: page.title,
								}))}
							/>
						</div>
					</aside>
				</div>
			)}
		</article>
	)
}
