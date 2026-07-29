'use client'

import { toBlob, toPng } from 'html-to-image'
import { withSafeExportStage } from './render-template-export-stage.client'

/**
 * canonical HTML을 안전한 export stage에서 PNG로 저장하는 client use case.
 * DOM 캡처와 브라우저 다운로드 I/O는 이 adapter가 소유한다.
 */
export async function exportHtmlToPng(html: string, css: string, fileName: string): Promise<void> {
	const dataUrl = await withSafeExportStage(html, css, (stage) =>
		toPng(stage, { cacheBust: true }),
	)
	const link = document.createElement('a')
	link.href = dataUrl
	link.download = `${fileName}.png`
	link.click()
}

/**
 * TIFF·PDF 변환용 흰 배경 PNG를 템플릿 픽셀 크기 그대로 만든다.
 * DOM 캡처 I/O는 이 client adapter가 소유하며 pixelRatio 1을 강제한다.
 */
export async function renderHtmlToPngBlob(
	html: string,
	css: string,
	width: number,
	height: number,
): Promise<Blob> {
	const blob = await withSafeExportStage(html, css, (stage) =>
		toBlob(stage, {
			backgroundColor: '#fff',
			cacheBust: true,
			canvasHeight: height,
			canvasWidth: width,
			pixelRatio: 1,
		}),
	)
	if (!blob) throw new Error('PNG rendering failed.')
	return blob
}
