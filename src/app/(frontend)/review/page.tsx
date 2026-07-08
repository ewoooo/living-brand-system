import { CheckResultSummary } from '@/features/asset-check/components/check-result-summary'
import { ImageUploadCarousel } from '@/features/asset-check/components/image-upload-carousel'
import { CheckSections } from '@/features/asset-check/components/rule-tables'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'

export default async function ReviewPage() {
	const sections = await getCheckRuleset()

	return (
		<main className="flex w-full max-w-[1250px] flex-col px-8 py-10">
			<header className="mb-8">
				<hgroup className="mb-4">
					<h2 className="pb-1 text-muted-foreground text-xl">검사하기</h2>
					<h1 className="text-3xl">Asset Quality Review</h1>
				</hgroup>
				<p className="mb-4 text-muted-foreground">
					제작한 디자인 산출물을 업로드하면 브랜드 가이드라인 기준에 맞는지 자동으로
					검수합니다. <wbr /> 색·로고·명함 등 항목별로 통과·미통과를 한눈에 확인하고,
					가이드라인에서 벗어난 부분을 빠르게 바로잡을 수 있습니다.
				</p>
			</header>
			<div className="sticky top-0 z-10 pb-2">
				<ImageUploadCarousel />
				<CheckResultSummary sections={sections} />
			</div>
			<div className="w-full">
				<CheckSections sections={sections} />
			</div>
		</main>
	)
}
