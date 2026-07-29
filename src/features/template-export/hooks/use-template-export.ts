'use client'

import { useState } from 'react'
import type { PrintPpi } from '../print-policy'
import {
	downloadTemplateTiff,
	TemplateTiffDownloadError,
} from '../services/export-template-tiff.client'
import { printTemplatePdf } from '../services/print-template-pdf.client'
import { exportHtmlToPng, renderHtmlToPngBlob } from '../services/render-template-html.client'

export type TemplateExportFormat = 'png' | 'tiff' | 'pdf'

/** PNG·TIFF·PDF export의 UI 상태와 형식별 service 호출만 조정한다. */
export function useTemplateExport({
	fileName,
	height,
	html,
	printPpi,
	templateId,
	templateVersion,
	width,
}: {
	fileName: string
	height: number
	html: string
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	width: number
}) {
	const [exporting, setExporting] = useState<TemplateExportFormat | null>(null)
	const [exportError, setExportError] = useState<string | null>(null)

	async function exportTemplate(format: TemplateExportFormat): Promise<void> {
		if (format !== 'png' && !printPpi) return
		if (format === 'tiff' && !templateVersion) return

		setExportError(null)
		setExporting(format)

		try {
			if (format === 'png') {
				await exportHtmlToPng(html, '', fileName)
			} else if (format === 'tiff' && templateVersion) {
				const png = await renderHtmlToPngBlob(html, '', width, height)
				await downloadTemplateTiff({
					fileName,
					png,
					templateId,
					templateVersion,
				})
			} else if (format === 'pdf' && printPpi) {
				await printTemplatePdf({ fileName, height, html, ppi: printPpi, width })
			}
		} catch (error) {
			if (format === 'png') {
				setExportError(
					'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
				)
			} else if (format === 'tiff') {
				setExportError(
					error instanceof TemplateTiffDownloadError
						? error.message
						: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
				)
			} else {
				setExportError(
					'PDF 인쇄창을 열지 못했습니다. 브라우저의 인쇄 기능을 확인해 주세요.',
				)
			}
		} finally {
			setExporting(null)
		}
	}

	return { exporting, exportError, exportTemplate }
}
