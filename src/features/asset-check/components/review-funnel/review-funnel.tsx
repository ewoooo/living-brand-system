import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { ReviewResultDetails } from './review-result-details'
import { ReviewResultOverview } from './review-result-overview'
import { ReviewTargetStep } from './review-target-step'

interface ReviewFunnelProps {
	/**
	 * 서버 입력 형식: published guideline 문서별 Check를 화면 배치 정보와 함께 묶은
	 * `CheckSection[]`. 각 section은 `checks: RuntimeCheck[]`를 포함한다.
	 */
	sections: CheckSection[]
}

/** 검수 페이지의 대상 선택 → 결과 요약 → 결과 상세 배치만 소유한다. */
export function ReviewFunnel({ sections }: ReviewFunnelProps) {
	return (
		<>
			<section className="grid grid-cols-1 md:grid-cols-2 top-0 z-10 pb-2">
				<ReviewResultDetails sections={sections} />
				<ReviewTargetStep />
			</section>
		</>
	)
}
