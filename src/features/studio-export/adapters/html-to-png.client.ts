'use client'

import { elementToPng } from './element-to-png.client'
import { withSafeExportStage } from './render-export-stage.client'

/**
 * canonical HTML을 안전한 export stage에서 PNG Blob으로 변환한다.
 * DOM 캡처 I/O는 이 adapter가 소유하고 다운로드는 공통 useExport가 담당한다.
 */
export async function htmlToPng(
	html: string,
	width: number,
	height: number,
	options: { scale: number; transparent: boolean },
): Promise<Blob> {
	return withSafeExportStage(html, (stage) => elementToPng(stage, { width, height, ...options }))
}
