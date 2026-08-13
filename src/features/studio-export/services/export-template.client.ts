'use client'

import { htmlToPng } from '../adapters/html-to-png.client'
import type { ExportResult } from '../export-contract'
import type { StudioExportSource } from './execute-studio-export'
import {
	canExportTemplate,
	type TemplateExportContext,
	type TemplateExportMetadata,
	type TemplateExportRequest,
	type TemplateRasterArtifact,
	type TemplateRasterArtifactProducer,
} from './export-template'
import { requestTemplatePrint, TemplatePrintDownloadError } from './export-template-print.client'

const EXPORT_ERROR_MESSAGES: Record<TemplateExportRequest['format'], string> = {
	png: 'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
	pdf: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
	tiff: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
}

/** Template Raster Artifact와 metadata를 기존 공통 export 실행 port에 결합하는 이행 bridge다. */
export function createTemplateExportSource(
	artifact: TemplateRasterArtifactProducer,
	context: TemplateExportContext,
): StudioExportSource<TemplateExportRequest> {
	return {
		raster: {
			png: async (request) => {
				assertCanExportTemplate(request, context)
				return exportTemplatePng(request, await artifact(), context)
			},
		},
		print: {
			tiff: async (request) => {
				assertCanExportTemplate(request, context)
				return exportTemplateTiff(request, await artifact(), context)
			},
			pdf: async (request) => {
				assertCanExportTemplate(request, context)
				return exportTemplatePdf(request, await artifact(), context)
			},
		},
	}
}

/** Template PNG 출력을 실행한다. DOM 캡처 I/O는 htmlToPng adapter가 소유한다. */
export async function exportTemplatePng(
	request: Extract<TemplateExportRequest, { format: 'png' }>,
	artifact: TemplateRasterArtifact,
	context: TemplateExportContext,
): Promise<ExportResult> {
	const metadata = assertCanExportTemplate(request, context)
	try {
		const { height, html, width } = artifact.source
		const data = await htmlToPng(html, width, height, request.options)
		return { data, filename: `${metadata.fileName}.png`, mimeType: 'image/png' }
	} catch (error) {
		throw new Error(EXPORT_ERROR_MESSAGES.png, { cause: error })
	}
}

/** Template PDF 출력을 실행한다. DOM·HTTP I/O는 client adapter가 소유한다. */
export function exportTemplatePdf(
	request: Extract<TemplateExportRequest, { format: 'pdf' }>,
	artifact: TemplateRasterArtifact,
	context: TemplateExportContext,
): Promise<ExportResult> {
	return exportTemplatePrint(request, artifact, context, 'application/pdf')
}

/** Template TIFF 출력을 실행한다. DOM·HTTP I/O는 client adapter가 소유한다. */
export function exportTemplateTiff(
	request: Extract<TemplateExportRequest, { format: 'tiff' }>,
	artifact: TemplateRasterArtifact,
	context: TemplateExportContext,
): Promise<ExportResult> {
	return exportTemplatePrint(request, artifact, context, 'image/tiff')
}

async function exportTemplatePrint(
	request: Extract<TemplateExportRequest, { format: 'pdf' | 'tiff' }>,
	artifact: TemplateRasterArtifact,
	context: TemplateExportContext,
	mimeType: 'application/pdf' | 'image/tiff',
): Promise<ExportResult> {
	const metadata = assertCanExportTemplate(request, context)
	try {
		// canExportTemplate이 templateVersion 존재를 보장한다 — 타입 좁히기용 가드.
		const { templateVersion } = metadata
		if (!templateVersion)
			throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
		const { height, html, width } = artifact.source
		const png = await htmlToPng(html, width, height, {
			scale: 1,
			transparent: false,
		})
		const data = await requestTemplatePrint({
			colorProfile: request.colorProfile.icc,
			fileName: metadata.fileName,
			format: request.format,
			png,
			templateId: metadata.templateId,
			templateVersion,
		})
		return {
			data,
			filename: `${metadata.fileName}.${request.format}`,
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
): TemplateExportMetadata {
	if (!canExportTemplate(request, context)) {
		throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
	}
	// canExportTemplate이 null을 거부한다 — 실행 함수의 타입 좁히기용 반환값이다.
	return context.metadata as TemplateExportMetadata
}
