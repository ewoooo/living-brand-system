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
		raster: { png: (request) => exportTemplatePng(request, context) },
		print: {
			tiff: (request) => exportTemplateTiff(request, context),
			pdf: (request) => exportTemplatePdf(request, context),
		},
	}
}

/** Template PNG 출력을 실행한다. DOM 캡처 I/O는 htmlToPng adapter가 소유한다. */
export async function exportTemplatePng(
	request: Extract<TemplateExportRequest, { format: 'png' }>,
	context: TemplateExportContext,
): Promise<ExportResult> {
	assertCanExportTemplate(request, context)
	try {
		const data = await htmlToPng(context.html, context.width, context.height, request.options)
		return { data, filename: `${context.fileName}.png`, mimeType: 'image/png' }
	} catch (error) {
		throw new Error(EXPORT_ERROR_MESSAGES.png, { cause: error })
	}
}

/** Template PDF 출력을 실행한다. DOM·HTTP I/O는 client adapter가 소유한다. */
export function exportTemplatePdf(
	request: Extract<TemplateExportRequest, { format: 'pdf' }>,
	context: TemplateExportContext,
): Promise<ExportResult> {
	return exportTemplatePrint(request, context, 'application/pdf')
}

/** Template TIFF 출력을 실행한다. DOM·HTTP I/O는 client adapter가 소유한다. */
export function exportTemplateTiff(
	request: Extract<TemplateExportRequest, { format: 'tiff' }>,
	context: TemplateExportContext,
): Promise<ExportResult> {
	return exportTemplatePrint(request, context, 'image/tiff')
}

async function exportTemplatePrint(
	request: Extract<TemplateExportRequest, { format: 'pdf' | 'tiff' }>,
	context: TemplateExportContext,
	mimeType: 'application/pdf' | 'image/tiff',
): Promise<ExportResult> {
	assertCanExportTemplate(request, context)
	try {
		// canExportTemplate이 templateVersion 존재를 보장한다 — 타입 좁히기용 가드.
		const { templateVersion } = context
		if (!templateVersion)
			throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
		const png = await htmlToPng(context.html, context.width, context.height, {
			scale: 1,
			transparent: false,
		})
		const data = await requestTemplatePrint({
			colorProfile: request.colorProfile.icc,
			fileName: context.fileName,
			format: request.format,
			png,
			templateId: context.templateId,
			templateVersion,
		})
		return {
			data,
			filename: `${context.fileName}.${request.format}`,
			mimeType,
		}
	} catch (error) {
		// 인쇄 다운로드의 사용자 조치 가능 메시지는 그대로 UI에 노출한다.
		if (error instanceof TemplatePrintDownloadError) throw error
		throw new Error(EXPORT_ERROR_MESSAGES[request.format], { cause: error })
	}
}

function assertCanExportTemplate(
	request: TemplateExportRequest,
	context: TemplateExportContext,
): void {
	if (!canExportTemplate(request, context)) {
		throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
	}
}
