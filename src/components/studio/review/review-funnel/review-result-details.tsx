import { CheckSections } from '@/components/studio/review/result/check-review-table'
import { Typography } from '@/components/ui/typography'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'

type ReviewResultDetailsProps = { sections: CheckSection[] }

/** 서버의 `CheckSection[]`에 선택 이미지의 `results[checkKey]`를 결합해 항목별 결과를 표시한다. */
export function ReviewResultDetails({ sections }: ReviewResultDetailsProps) {
	return (
		<section
			data-slot="review-result-details"
			aria-labelledby="review-result-details-title"
			className="w-full order-2 lg:order-1"
		>
			<Typography as="h2" id="review-result-details-title" className="sr-only">
				검사 결과 상세
			</Typography>
			<CheckSections sections={sections} />
		</section>
	)
}
