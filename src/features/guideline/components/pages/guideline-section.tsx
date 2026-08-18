import { ContentFrame } from '@/components/shared/content-frame'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import { GuidelineHelperProvider, GuidelineHelperSlot } from '../globals/guideline-helper'
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

	return (
		// Helper(하단 Floating Controller)의 provider와 자리는 이 <article> 하나가 감싼다 —
		// 컨트롤을 가진 블록이 전부 이 안에 있고, 알약이 본문 폭 기준으로 가운데에 서야 하기 때문이다.
		<GuidelineHelperProvider>
			<article className="relative w-full">
				{/* Payload Preview Functions */}
				{previewDocumentId !== undefined && <RefreshRouteOnSave />}
				{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}

				<ContentFrame>
					{/* Deprecated */}
					<GuidelineHeaderImage image={section.headerImage} />
				</ContentFrame>

				{/*Guideline Section*/}
				<section className="flex flex-col gap-16" aria-label="guideline-section">
					{/* Guideline Section */}
					<section className="grid grid-rows-[auto_1fr] gap-8">
						<ContentFrame>
							<hgroup className="grid grid-cols-2 gap-4">
								<GuidelineHeader variant={variant} title={section.title} />
								<GuidelineDescription
									variant={variant}
									description={section.description}
								/>
							</hgroup>
						</ContentFrame>
						{/* Guideline Section Contents */}
						<GuidelineBlocks
							blocks={section.blocks}
							betterEditor={previewDocumentId !== undefined && !previewedPage}
						/>
					</section>
					{/* Guideline Page Render*/}
					<section className="flex flex-col gap-32" aria-label="guideline-pages">
						{section.pages.map((page) => (
							<GuidelinePage
								key={page.id}
								page={page}
								betterEditor={page.id === previewDocumentId}
							/>
						))}
					</section>
				</section>

				<GuidelineHelperSlot />
			</article>
		</GuidelineHelperProvider>
	)
}
