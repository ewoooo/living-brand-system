import { ReviewFunnel } from '@/features/asset-check/components/review-funnel/review-funnel'
import { ReviewHeader } from '@/features/asset-check/components/review-header'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'

export default async function ReviewPage() {
	const sections = await getCheckRuleset()
	const TITLE = 'Check Assets'
	const DESCRIPTION = 'Check Your Creations'

	return (
		<div className="flex w-full flex-col px-8 py-10">
			<header className="mb-8">
				<ReviewHeader title={TITLE} description={DESCRIPTION} />
			</header>
			<ReviewFunnel sections={sections} />
		</div>
	)
}
