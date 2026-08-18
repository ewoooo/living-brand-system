'use client'

import { ReviewRuleDetail } from '@/components/studio/review/review-rule-detail'
import { ImageUploadCarousel } from '@/components/studio/review/upload/image-upload-carousel'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 검수 캔버스 열 — 대상 미리보기와 판정 근거 패널이 이 열을 나눠 쓴다.
 * 근거 패널이 열리면 미리보기가 좁아진다(공용 셸은 2열 그대로다).
 * 어느 룰이 펼쳐졌는지는 컨텍스트가 갖는다 — 사이드바를 직접 알지 않는다.
 * 디자인 SSOT: Figma HD_LBS_UI 56:2087 "Review - Result Detail".
 */
export function ReviewCanvas() {
	const { selected, selectedRuleKey } = useCheckImages()
	// 판정이 사라진 룰(재검수·시나리오 변경)은 패널을 스스로 닫는다 — 별도 정리 경로가 필요 없다.
	const outcome = selectedRuleKey ? selected?.results?.[selectedRuleKey] : undefined

	return (
		<div
			data-slot="review-canvas"
			className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
		>
			<ImageUploadCarousel />
			{outcome && <ReviewRuleDetail outcome={outcome} />}
		</div>
	)
}
