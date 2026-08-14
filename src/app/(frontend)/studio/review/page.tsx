import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'
import { ReviewFunnel } from '@/components/studio/review/review-funnel/review-funnel'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

export default async function ReviewPage() {
	await requireUser(routes.studio.review)
	const sections = await getCheckRuleset()
	const TITLE = 'Check Assets'
	const DESCRIPTION = 'Check Your Creations'

	return (
		<ContentFrame className="flex max-w-[1440px] flex-col gap-8 py-10">
			<ContentHeading title={TITLE} description={DESCRIPTION} />
			<ReviewFunnel sections={sections} />
		</ContentFrame>
	)
}
