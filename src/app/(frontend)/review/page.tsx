import { ReviewFunnel } from '@/features/asset-check/components/review-funnel/review-funnel'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'

export default async function ReviewPage() {
	const sections = await getCheckRuleset()
	const TITLE = 'Check Assets'
	const DESCRIPTION = 'Check Your Creations'

	return (
		<div className="flex w-full flex-col px-8 py-10">
			<header className="mb-8">
				<ReviewHeader title={TITLE} description={DESCRIPTION} />
				{/*<GuidelineHeader title="Check Asset" />*/}
			</header>
			<ReviewFunnel sections={sections} />
		</div>
	)
}

function ReviewHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="">
			<h1 className="type-large-title pb-4">{title}</h1>
			<p className="type-body pl-2 text-muted-foreground">{description}</p>
		</div>
	)
}
