'use client'

import { useState } from 'react'
import { ReviewCanvasControls } from '@/components/studio/review/review-canvas-controls'
import { ImageUploadCarousel } from '@/components/studio/review/upload/image-upload-carousel'
import { DEFAULT_PREVIEW_SIZE } from '@/components/studio/shared/preview-size-control'

/**
 * 검수 캔버스 열 — 대상 미리보기와 하단 바만 갖는다.
 * 판정 근거 패널은 사이드바 블록이 소유한다(디자인 78:2706 — 확장은 사이드바 쪽이다).
 * 디자인 SSOT: Figma HD_LBS_UI 56:2087 "Review - Result Detail".
 */
export function ReviewCanvas() {
	// 표시 크기는 출력과 무관한 이 화면만의 상태다 — Template·Graphic 캔버스와 같은 자리.
	const [previewSize, setPreviewSize] = useState(DEFAULT_PREVIEW_SIZE)

	return (
		// 🔴 하단 바(absolute left-1/2)의 relative 기준은 이 열이다 — 근거 패널이 사이드바로
		//    옮겨간 뒤에도 바는 캔버스 중앙에 남아야 한다(디자인 56:2087).
		<div data-slot="review-canvas" className="relative flex min-h-0 min-w-0 flex-1 flex-col">
			<ImageUploadCarousel previewSize={previewSize} />
			<ReviewCanvasControls previewSize={previewSize} onPreviewSizeChange={setPreviewSize} />
		</div>
	)
}
