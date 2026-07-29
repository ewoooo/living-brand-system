'use client'

import { type PrintPpi, pixelsToMillimeters } from '../print-policy'
import { waitForExportStageAssets, withSafeExportStage } from './render-template-html.client'

const CSS_PIXELS_PER_INCH = 96

export interface PrintTemplatePdfInput {
	fileName: string
	height: number
	html: string
	ppi: PrintPpi
	width: number
}

/**
 * canonical HTML을 운영자 PPI의 단일 페이지 RGB 벡터 PDF로 인쇄하는 client use case.
 * 안전 DOM 구성은 browser renderer가, iframe과 브라우저 인쇄 I/O는 이 service가 소유한다.
 */
export async function printTemplatePdf({
	fileName,
	height,
	html,
	ppi,
	width,
}: PrintTemplatePdfInput): Promise<void> {
	await withSafeExportStage(html, '', async (stage) => {
		const widthMm = pixelsToMillimeters(width, ppi)
		const heightMm = pixelsToMillimeters(height, ppi)
		const iframe = document.createElement('iframe')
		iframe.setAttribute('aria-hidden', 'true')
		iframe.setAttribute('sandbox', 'allow-modals allow-same-origin')
		iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthMm}mm;height:${heightMm}mm;border:0`
		iframe.title = `${fileName} PDF 인쇄`
		document.body.appendChild(iframe)

		try {
			const printDocument = iframe.contentDocument
			const printWindow = iframe.contentWindow
			if (!printDocument || !printWindow || typeof printWindow.print !== 'function') {
				throw new Error('Browser print is unavailable.')
			}

			printDocument.title = fileName
			const style = printDocument.createElement('style')
			style.textContent = `
				@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
				html, body {
					margin: 0;
					width: ${widthMm}mm;
					height: ${heightMm}mm;
					overflow: hidden;
					background: #fff;
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
			`
			printDocument.head.appendChild(style)

			const page = printDocument.createElement('div')
			page.style.cssText = `width:${widthMm}mm;height:${heightMm}mm;overflow:hidden;background:#fff`
			const content = printDocument.createElement('div')
			content.style.cssText = `width:${width}px;height:${height}px;transform:scale(${
				CSS_PIXELS_PER_INCH / ppi
			});transform-origin:top left`
			const printableStage = printDocument.importNode(stage, true)
			content.appendChild(printableStage)
			page.appendChild(content)
			printDocument.body.appendChild(page)

			await waitForExportStageAssets(printableStage)
			await new Promise((resolve) => printWindow.requestAnimationFrame(resolve))
			printWindow.focus()
			printWindow.print()
		} finally {
			iframe.remove()
		}
	})
}
