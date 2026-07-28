import { StudioExamples } from '@/components/studio/studio-examples'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'

export default function StudioExamplesPage() {
	return (
		<GuidelineContentFrame className="py-10">
			<StudioExamples />
		</GuidelineContentFrame>
	)
}
