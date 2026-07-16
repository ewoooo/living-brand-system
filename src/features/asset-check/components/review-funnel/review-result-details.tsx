import { CheckSections } from '@/features/asset-check/components/result/check-review-table'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'

/** 서버의 `CheckSection[]`에 선택 이미지의 `results[checkKey]`를 결합해 항목별 결과를 표시한다. */
export function ReviewResultDetails({ sections }: { sections: CheckSection[] }) {
	return (
		<section
			aria-labelledby="review-result-details-title"
			className="w-full order-2 lg:order-1"
		>
			<h2 id="review-result-details-title" className="sr-only">
				검사 결과 상세
			</h2>
			<CheckSections sections={sections} />
		</section>
	)
}
