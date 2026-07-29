import { ContentHeading } from '@/components/shared/content-heading'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'

export default function CreatePage() {
	return (
		<GuidelineContentFrame className="py-10">
			<ContentHeading
				title="Create Assets"
				description="사이드바에서 카테고리와 템플릿을 선택해 산출물을 만듭니다."
			/>
		</GuidelineContentFrame>
	)
}
