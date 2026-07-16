import { ReviewFunnel } from '@/features/asset-check/components/review-funnel/review-funnel'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'

export default async function ReviewPage() {
	const sections = await getCheckRuleset()

	return (
		<div className="flex w-full max-w-[1250px] flex-col px-8 py-10">
			<header className="mb-8">
				<GuidelineHeader title="Check Asset" />

				<p className="mb-4 text-foreground-muted">
					제작한 디자인 산출물을 업로드하면 브랜드 가이드라인 기준에 맞는지 자동으로
					검수합니다. <wbr /> 색·로고·명함 등 항목별로 통과·미통과를 한눈에 확인하고,
					가이드라인에서 벗어난 부분을 빠르게 바로잡을 수 있습니다.
				</p>
			</header>
			<ReviewFunnel sections={sections} />
		</div>
	)
}
