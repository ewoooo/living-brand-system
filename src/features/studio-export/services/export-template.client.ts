'use client'

import { htmlToPng } from '../adapters/html-to-png.client'
import type { ExportResult } from '../export-contract'
import type { StudioExportSource } from './execute-studio-export'
import {
	canExportTemplate,
	type TemplateExportContext,
	type TemplateExportRequest,
} from './export-template'
import { requestTemplatePrint, TemplatePrintDownloadError } from './export-template-print.client'

const EXPORT_ERROR_MESSAGES: Record<TemplateExportRequest['format'], string> = {
	png: 'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
	pdf: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
	tiff: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
}

/** Template canonical HTML과 print identity를 공통 export 실행 port에 결합한다. */
export function createTemplateExportSource(
	context: TemplateExportContext,
): StudioExportSource<TemplateExportRequest> {
	return {
		raster: { png: (request) => exportTemplate(request, context) },
		print: {
			tiff: (request) => exportTemplate(request, context),
			pdf: (request) => exportTemplate(request, context),
		},
	}
}

/**
 * 선택한 형식의 client export use case를 실행한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export async function exportTemplate(
	request: TemplateExportRequest,
	context: TemplateExportContext,
): Promise<ExportResult> {
	const { format } = request
	if (!canExportTemplate(request, context)) {
		throw new Error(`${format.toUpperCase()} export is unavailable.`)
	}
	try {
		switch (format) {
			case 'png': {
				const data = await htmlToPng(
					context.html,
					context.width,
					context.height,
					request.options,
				)
				return { data, filename: `${context.fileName}.png`, mimeType: 'image/png' }
			}
			case 'pdf':
			case 'tiff': {
				// canExportTemplate이 templateVersion 존재를 보장한다 — 타입 좁히기용 가드.
				const { templateVersion } = context
				if (!templateVersion) {
					throw new Error(`${format.toUpperCase()} export is unavailable.`)
				}
				const png = await htmlToPng(context.html, context.width, context.height, {
					scale: 1,
					transparent: false,
				})
				const data = await requestTemplatePrint({
					colorProfile: request.colorProfile.icc,
					fileName: context.fileName,
					format,
					png,
					templateId: context.templateId,
					templateVersion,
				})
				return {
					data,
					filename: `${context.fileName}.${format}`,
					mimeType: format === 'pdf' ? 'application/pdf' : 'image/tiff',
				}
			}
		}
	} catch (error) {
		// 인쇄 다운로드의 사용자 조치 가능 메시지는 그대로 UI에 노출한다.
		if (error instanceof TemplatePrintDownloadError) throw error
		throw new Error(EXPORT_ERROR_MESSAGES[format], { cause: error })
	}
}
