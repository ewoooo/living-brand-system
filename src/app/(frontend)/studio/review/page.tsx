import { ContentHeading } from '@/components/shared/content-heading'
import { ReviewFunnel } from '@/components/studio/review/review-funnel/review-funnel'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'

export default async function ReviewPage() {
	const sections = await getCheckRuleset()
	const TITLE = 'Check Assets'
	const DESCRIPTION = 'Check Your Creations'

	return (
		<GuidelineContentFrame className="flex max-w-[1440px] flex-col gap-8 py-10">
			<ContentHeading title={TITLE} description={DESCRIPTION} />
			<ReviewFunnel sections={sections} />
		</GuidelineContentFrame>
	)
}
