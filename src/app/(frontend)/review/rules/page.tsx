import { CheckCatalog } from '@/features/asset-check/components/check-catalog'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'

export default async function ReviewRulesPage() {
	const sections = await getCheckRuleset()

	return (
		<div className="w-full max-w-[1250px] px-8 py-10">
			<header className="mb-8">
				<hgroup className="mb-4">
					<h2 className="type-title-2 pb-1 text-foreground-muted">Check 조회</h2>
					<h1 className="type-large-title">검수 Check</h1>
				</hgroup>
				<p className="text-foreground-muted">
					브랜드 산출물 검수에 사용하는 Check와 근거를 한 페이지에서 확인합니다.
				</p>
			</header>
			<CheckCatalog sections={sections} />
		</div>
	)
}
