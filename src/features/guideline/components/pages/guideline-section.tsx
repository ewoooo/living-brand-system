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
		<article className="w-full">
			{/* Payload Preview Functions */}
			{previewDocumentId !== undefined && <RefreshRouteOnSave />}
			{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}

			{/* 모든 섹션 페이지가 동일 레이아웃을 갖도록 그리드를 항상 적용한다(변종 방지).
			    ToC 컬럼(12rem)은 항상 예약되고, page가 없는 섹션은 그 자리만 비운다. */}
			<div className="mx-auto w-full xl:grid xl:max-w-[1640px] xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-8 xl:px-6">
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
