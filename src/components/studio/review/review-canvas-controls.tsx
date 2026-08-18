'use client'

import { ChevronLeft, ChevronRight, Grid } from '@carbon/icons-react'
import { FloatingControllerFixed } from '@/components/shared/controller'
import { PreviewSizeControl } from '@/components/studio/shared/preview-size-control'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 캔버스 하단 바 — 프리뷰 크기 · 파일 이동 · 보기 전환.
 * 바 안의 컨트롤은 모두 muted 표면으로 채운다(디자인 59:3039) — 떠 있는 흰 바 위에서
 * 투명한 컨트롤은 경계가 사라진다.
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
		<FloatingControllerFixed>
			<PreviewSizeControl value={previewSize} onChange={onPreviewSizeChange} />
			<Button
				type="button"
				variant="muted"
				className="h-9 w-10"
				aria-label="이전 파일"
				disabled={index <= 0}
				onClick={() => step(-1)}
			>
				<ChevronLeft aria-hidden />
			</Button>
			<div className="flex h-9 items-center rounded-md bg-muted">
				<span className="sr-only">
					{images.length}개 중 {position}번째 파일
				</span>
				<Typography aria-hidden as="span" size="sm" className="px-3">
					{position}
				</Typography>
				<span aria-hidden className="h-5 w-px bg-border" />
				<Typography aria-hidden as="span" size="sm" tone="muted" className="px-3">
					{images.length}
				</Typography>
			</div>
			<Button
				type="button"
				variant="muted"
				className="h-9 w-10"
				aria-label="다음 파일"
				disabled={index < 0 || index >= images.length - 1}
				onClick={() => step(1)}
			>
				<ChevronRight aria-hidden />
			</Button>
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
		</FloatingControllerFixed>
	)
}
