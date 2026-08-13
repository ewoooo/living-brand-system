export type PreviewSize = { width: number; height: number }

/** 출력 비율을 유지하면서 사용 가능한 프리뷰 영역을 가장 크게 채운다. */
export function fitPreviewSize(bounds: PreviewSize, output: PreviewSize): PreviewSize {
	const scale = Math.min(bounds.width / output.width, bounds.height / output.height)
	return {
		width: Math.max(1, Math.floor(output.width * scale)),
		height: Math.max(1, Math.floor(output.height * scale)),
	}
}
