'use client'

import { useState } from 'react'
import { ReviewCanvasControls } from '@/components/studio/review/review-canvas-controls'
import { ReviewRuleDetail } from '@/components/studio/review/review-rule-detail'
import { ImageUploadCarousel } from '@/components/studio/review/upload/image-upload-carousel'
import { DEFAULT_PREVIEW_SIZE } from '@/components/studio/shared/preview-size-control'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 검수 캔버스 열 — 대상 미리보기와 판정 근거 패널이 이 열을 나눠 쓴다.
 * 근거 패널이 열리면 미리보기가 좁아진다(공용 셸은 2열 그대로다).
 * 어느 룰이 펼쳐졌는지는 컨텍스트가 갖는다 — 사이드바를 직접 알지 않는다.
 * 디자인 SSOT: Figma HD_LBS_UI 56:2087 "Review - Result Detail".
 */
export function ReviewCanvas() {
	const { selected, selectedRuleKey } = useCheckImages()
	// 표시 크기는 출력과 무관한 이 화면만의 상태다 — Template·Graphic 캔버스와 같은 자리.
	const [previewSize, setPreviewSize] = useState(DEFAULT_PREVIEW_SIZE)
	// 판정이 사라진 룰(재검수·시나리오 변경)은 패널을 스스로 닫는다 — 별도 정리 경로가 필요 없다.
	const outcome = selectedRuleKey ? selected?.results?.[selectedRuleKey] : undefined

	return (
		<div
			data-slot="review-canvas"
			className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
		>
			{/*
			 * 🔴 하단 바의 relative 기준은 이 열이지 바깥 그리드가 아니다. 바깥에 두면
			 *    `left-1/2`가 근거 패널까지 포함한 폭의 절반을 재서, 패널이 열릴 때마다 바가
			 *    패널 폭의 절반만큼 오른쪽으로 밀린다(디자인 56:2087은 캔버스 중앙).
			 */}
			<div data-slot="review-canvas-stage" className="relative flex min-h-0 min-w-0 flex-col">
				<ImageUploadCarousel previewSize={previewSize} />
				<ReviewCanvasControls
					previewSize={previewSize}
					onPreviewSizeChange={setPreviewSize}
				/>
			</div>
			{outcome && <ReviewRuleDetail outcome={outcome} />}
		</div>
	)
}
