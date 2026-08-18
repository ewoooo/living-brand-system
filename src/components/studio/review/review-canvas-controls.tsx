'use client'

import { ChevronLeft, ChevronRight, Grid } from '@carbon/icons-react'
import {
	PreviewSizeControl,
	StudioCanvasFooter,
} from '@/components/studio/shared/preview-size-control'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
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
	const position = index >= 0 ? index + 1 : 0

	function step(delta: number) {
		const next = images[index + delta]
		if (next) select(next.id)
	}

	return (
		<StudioCanvasFooter>
			<PreviewSizeControl value={previewSize} onChange={onPreviewSizeChange} />
			<div className="flex items-center gap-1">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="이전 파일"
					disabled={index <= 0}
					onClick={() => step(-1)}
				>
					<ChevronLeft aria-hidden />
				</Button>
				<Typography
					as="span"
					size="sm"
					tone="muted"
					className="min-w-14 text-center font-mono"
				>
					{position} / {images.length}
				</Typography>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="다음 파일"
					disabled={index < 0 || index >= images.length - 1}
					onClick={() => step(1)}
				>
					<ChevronRight aria-hidden />
				</Button>
			</div>
			{/* ponytail: 전체 결과 그리드 뷰는 아직 없다 — 자리만 잡아두고 잠근다. */}
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label="전체 결과 보기"
				disabled
				title="전체 결과 보기는 준비 중입니다"
			>
				<Grid aria-hidden />
			</Button>
		</StudioCanvasFooter>
	)
}
