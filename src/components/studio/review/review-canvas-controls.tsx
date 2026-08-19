'use client'

import { Grid } from '@carbon/icons-react'
import { Controller } from '@/components/shared/controller'
import { PreviewSizeControl } from '@/components/studio/shared/preview-size-control'
import { Button } from '@/components/ui/button'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 캔버스 하단 바 — 프리뷰 크기 · 파일 이동 · 보기 전환.
 * 파일 이동은 select()만 부른다. 캐러셀은 선택을 따라 스스로 스크롤하므로
 * 여기서 캐러셀을 알 필요가 없다.
 * 디자인 SSOT: Figma HD_LBS_UI 56:2 "Review Usecase".
 */
export function ReviewCanvasControls({
	previewSize,
	onPreviewSizeChange,
}: {
	previewSize: number
	onPreviewSizeChange: (value: number) => void
}) {
	const { images, selectedId, select } = useCheckImages()
	const index = images.findIndex((image) => image.id === selectedId)

	return (
		<Controller.Bar placement="canvas">
			<PreviewSizeControl value={previewSize} onChange={onPreviewSizeChange} />
			<Controller.Pagination
				index={index >= 0 ? index + 1 : 0}
				total={images.length}
				label="파일"
				onStep={(delta) => {
					const next = images[index + delta]
					if (next) select(next.id)
				}}
			/>
			{/* ponytail: 전체 결과 그리드 뷰는 아직 없다 — 자리만 잡아두고 잠근다. */}
			<Button
				type="button"
				variant="muted"
				className="h-9 w-10"
				aria-label="전체 결과 보기"
				disabled
				title="전체 결과 보기는 준비 중입니다"
			>
				<Grid aria-hidden />
			</Button>
		</Controller.Bar>
	)
}
