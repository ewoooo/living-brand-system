'use client'

import type { PrintPpi } from '../print-policy'
import { exportHtmlToPng, renderHtmlToPngBlob } from './export-template-png.client'
import { downloadTemplatePrint, TemplatePrintDownloadError } from './export-template-print.client'

export type TemplateExportFormat = 'png' | 'tiff' | 'pdf'

export type TemplateExportContext = {
	fileName: string
	height: number
	html: string
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	width: number
}

const EXPORT_ERROR_MESSAGES: Record<TemplateExportFormat, string> = {
	png: 'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
	pdf: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
	tiff: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
}

/**
 * 템플릿과 출력 정책으로 형식별 export 가능 여부를 판정한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export function canExportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): boolean {
	return format === 'png' || Boolean(context.printPpi && context.templateVersion)
}

/**
 * 선택한 형식의 client export use case를 실행한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export async function exportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): Promise<void> {
	if (!canExportTemplate(format, context)) {
		throw new Error(`${format.toUpperCase()} export is unavailable.`)
	}
	try {
		switch (format) {
			case 'png':
				await exportHtmlToPng(context.html, context.fileName)
				return
			case 'pdf':
			case 'tiff': {
				// canExportTemplate이 templateVersion 존재를 보장한다 — 타입 좁히기용 가드.
				const { templateVersion } = context
				if (!templateVersion) {
					throw new Error(`${format.toUpperCase()} export is unavailable.`)
				}
				const png = await renderHtmlToPngBlob(context.html, context.width, context.height)
				await downloadTemplatePrint({
					fileName: context.fileName,
					format,
					png,
					templateId: context.templateId,
					templateVersion,
				})
				return
			}
		}
	} catch (error) {
		// 인쇄 다운로드의 사용자 조치 가능 메시지는 그대로 UI에 노출한다.
		if (error instanceof TemplatePrintDownloadError) throw error
		throw new Error(EXPORT_ERROR_MESSAGES[format], { cause: error })
	}
}
