import { GuidelineContentFrame } from '@/features/guideline/components/blocks/common/guideline-content-frame'
import { cn } from '@/lib/utils'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/common/guideline-blocks'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import { GuidelineOnThisPage } from '../globals/guideline-on-this-page'
import { getGuidelineSectionPages } from '../globals/guideline-section-pages'
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

	// 단일 Page(제목이 섹션과 같음)는 목차가 무의미 → 제외.
	const tocPages = getGuidelineSectionPages(section)
	const hasToc = tocPages.length >= 2

	return (
		<article className="w-full">
			{/* Payload Preview Functions */}
			{previewDocumentId !== undefined && <RefreshRouteOnSave />}
			{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}

			<div
				className={cn(
					'mx-auto w-full',
					// 목차가 있을 때만 넓은 화면에서 2열(본문 + 우측 sticky 목차)로. 좁은 화면·목차 없으면 전체폭.
					hasToc &&
						'xl:grid xl:max-w-[1640px] xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-8 xl:px-6',
				)}
			>
				<div className="min-w-0">
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
				</div>

				{hasToc && (
					<aside className="hidden xl:block">
						<div className="sticky top-24 pt-16">
							<GuidelineOnThisPage
								pages={tocPages.map((page) => ({
									id: page.id,
									slug: page.slug,
									title: page.title,
								}))}
							/>
						</div>
					</aside>
				)}
			</div>
		</article>
	)
}
