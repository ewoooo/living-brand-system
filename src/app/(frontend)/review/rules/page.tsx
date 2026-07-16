import { CheckCatalog } from '@/features/asset-check/components/catalog/check-catalog'
import { ReviewHeader } from '@/features/asset-check/components/review-header'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'

export default async function ReviewRulesPage() {
	const [sections, scenarios] = await Promise.all([getCheckRuleset(), getCheckScenarios()])

	return (
		<div className="w-full max-w-[1250px] px-8 py-10">
			<header className="mb-8">
				<ReviewHeader title="Review" />
			</header>
			<CheckCatalog sections={sections} scenarios={scenarios} />
		</div>
	)
}
