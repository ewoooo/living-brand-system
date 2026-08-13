'use client'

import { useState } from 'react'
import type { ExportResult, StudioOutputFormat } from '../export-contract'
import type { StudioExportSource } from '../services/execute-studio-export'
import {
	exportHtmlRasterArtifactAsJpeg,
	exportHtmlRasterArtifactAsPng,
	renderHtmlRasterArtifactToPng,
} from '../services/export-artifact.client'
import {
	requestTemplatePrint,
	TemplatePrintDownloadError,
} from '../services/export-template-print.client'
import {
	canExportTemplate,
	createTemplateExportRequest,
	type TemplateExportContext,
	type TemplateExportMetadata,
	type TemplateExportRequest,
	type TemplateRasterArtifactProducer,
} from '../services/template-export-policy'
import type { StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

export type TemplateExportView = ReturnType<typeof useTemplateExport>

/** Template Raster Artifact·metadata·출력 정책을 기존 export 실행 bridge에 연결한다. */
export function useTemplateExport({
	artifact,
	capability,
	metadata,
}: {
	artifact: TemplateRasterArtifactProducer
	capability: StudioOutputCapability
	metadata: TemplateExportMetadata | null
}) {
	const [selectedFormat, setSelectedFormat] = useState<StudioOutputFormat | null>(null)
	const formats = capability.formats
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	const context: TemplateExportContext = { capability, metadata }
	const output = useExport<TemplateExportRequest>({
		capability,
		canExport: (request) => canExportTemplate(request, context),
		source: templateExportSource(artifact, metadata),
	})
	const request = createRequest(format, metadata)

	const canExportFormat = (candidate: StudioOutputFormat): boolean => {
		const candidateRequest = createRequest(candidate, metadata)
		return Boolean(candidateRequest && output.canExport(candidateRequest))
	}
	const runFormat = (candidate: StudioOutputFormat): void => {
		const candidateRequest = createRequest(candidate, metadata)
		if (candidateRequest) void output.run(candidateRequest)
	}

	return {
		busy: output.exporting !== null,
		error: output.error,
		formats,
		format,
		setFormat: (next: StudioOutputFormat) => {
			if (formats.includes(next)) setSelectedFormat(next)
		},
		canExport: Boolean(request && output.canExport(request)),
		run: () => {
			if (request) void output.run(request)
		},
		canExportFormat,
		runFormat,
	}
}

function templateExportSource(
	produce: TemplateRasterArtifactProducer,
	metadata: TemplateExportMetadata | null,
): StudioExportSource<TemplateExportRequest> {
	if (!metadata) return {}
	const printMetadata = metadata.templateVersion
		? { ...metadata, templateVersion: metadata.templateVersion }
		: null
	return {
		raster: {
			png: async (request) => {
				try {
					return await exportHtmlRasterArtifactAsPng(
						metadata.fileName,
						await produce(),
						request,
					)
				} catch (error) {
					throw new Error(
						'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
						{ cause: error },
					)
				}
			},
			jpeg: async (request) =>
				exportHtmlRasterArtifactAsJpeg(metadata.fileName, await produce(), request),
			...(printMetadata
				? {
						tiff: (request: Extract<TemplateExportRequest, { format: 'tiff' }>) =>
							exportTemplatePrint(request, produce, printMetadata, 'image/tiff'),
						pdf: (request: Extract<TemplateExportRequest, { format: 'pdf' }>) =>
							exportTemplatePrint(request, produce, printMetadata, 'application/pdf'),
					}
				: {}),
		},
	}
}

async function exportTemplatePrint(
	request: Extract<TemplateExportRequest, { format: 'pdf' | 'tiff' }>,
	produce: TemplateRasterArtifactProducer,
	metadata: TemplateExportMetadata & { templateVersion: string },
	mimeType: 'application/pdf' | 'image/tiff',
): Promise<ExportResult> {
	try {
		const png = await renderHtmlRasterArtifactToPng(await produce(), {
			scale: 1,
			transparent: false,
		})
		const data = await requestTemplatePrint({
			colorProfile: request.colorProfile.icc,
			fileName: metadata.fileName,
			format: request.format,
			png,
			templateId: metadata.templateId,
			templateVersion: metadata.templateVersion,
		})
		return { data, filename: `${metadata.fileName}.${request.format}`, mimeType }
	} catch (error) {
		if (error instanceof TemplatePrintDownloadError) throw error
		throw new Error(
			request.format === 'pdf'
				? 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
				: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
			{ cause: error },
		)
	}
}

function createRequest(
	format: StudioOutputFormat | null,
	metadata: TemplateExportMetadata | null,
): TemplateExportRequest | null {
	return format ? createTemplateExportRequest(format, metadata?.printPpi) : null
}
