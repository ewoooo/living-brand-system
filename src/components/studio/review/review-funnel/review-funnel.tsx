import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { ImageUploadCarousel } from '../upload/image-upload-carousel'
import { ReviewResultDetails } from './review-result-details'

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
		<section className="grid gap-4">
			<ReviewResultDetails sections={sections} />
			<ImageUploadCarousel />
		</section>
	)
}
