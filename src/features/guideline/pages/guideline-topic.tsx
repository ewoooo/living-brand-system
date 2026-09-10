import { GuidelineFooter } from '../components/guideline-footer'
import { GuidelineSections } from '../components/guideline-sections'
import { GuidelineTitleDisplay } from '../components/guideline-title-display'
import { RefreshRouteOnSave } from '../components/refresh-route-on-save'
import { GuidelineHelperProvider, GuidelineHelperSlot } from '../controllers/helper'
import type { GetGuidelineTopicOutput } from '../services/get-guideline-topic.service'

/** 페이지는 대표 영역·섹션·푸터를 조합하고, 프리뷰와 조작 환경을 연결한다. */
export function GuidelineTopic({
	topic,
	previewDocumentId,
}: {
	topic: GetGuidelineTopicOutput
	previewDocumentId?: number
}) {
	const isPreview = previewDocumentId !== undefined
	return (
		<GuidelineHelperProvider>
			<article className="relative flex w-full flex-col">
				{isPreview && <RefreshRouteOnSave />}
				<GuidelineTitleDisplay title={topic.title} image={topic.headerImage} />
				<GuidelineSections blocks={topic.blocks} betterEditor={isPreview} />
				<GuidelineFooter />
				<GuidelineHelperSlot />
			</article>
		</GuidelineHelperProvider>
	)
}
