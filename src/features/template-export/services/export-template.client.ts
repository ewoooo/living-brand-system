'use client'

import type { PrintPpi, TemplatePrintFormat } from '../print-policy'
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

type TemplateExporter = {
	errorMessage: string
	isAvailable: (context: TemplateExportContext) => boolean
	run: (context: TemplateExportContext) => Promise<void>
}

async function exportTemplateAsPng(context: TemplateExportContext): Promise<void> {
	await exportHtmlToPng(context.html, context.fileName)
}

async function exportTemplateAsPrint(
	context: TemplateExportContext,
	format: TemplatePrintFormat,
): Promise<void> {
	const png = await renderHtmlToPngBlob(context.html, context.width, context.height)
	await downloadTemplatePrint({
		fileName: context.fileName,
		format,
		png,
		templateId: context.templateId,
		// exportTemplate의 isAvailable 검사가 templateVersion 존재를 보장한다.
		templateVersion: context.templateVersion as string,
	})
}

const exporters = {
	png: {
		errorMessage:
			'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
		isAvailable: () => true,
		run: exportTemplateAsPng,
	},
	pdf: {
		errorMessage: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
		isAvailable: ({ printPpi, templateVersion }) => Boolean(printPpi && templateVersion),
		run: (context) => exportTemplateAsPrint(context, 'pdf'),
	},
	tiff: {
		errorMessage: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
		isAvailable: ({ printPpi, templateVersion }) => Boolean(printPpi && templateVersion),
		run: (context) => exportTemplateAsPrint(context, 'tiff'),
	},
} satisfies Record<TemplateExportFormat, TemplateExporter>

/**
 * 템플릿과 출력 정책으로 형식별 export 가능 여부를 판정한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export function canExportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): boolean {
	return exporters[format].isAvailable(context)
}

/**
 * 선택한 형식의 client export use case를 실행한다.
 * 실제 DOM·HTTP·다운로드 I/O는 registry가 위임하는 형식별 client adapter가 소유한다.
 */
export async function exportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): Promise<void> {
	const exporter = exporters[format]
	if (!exporter.isAvailable(context)) {
		throw new Error(`${format.toUpperCase()} export is unavailable.`)
	}
	try {
		await exporter.run(context)
	} catch (error) {
		if (error instanceof TemplatePrintDownloadError) throw error
		throw new Error(exporter.errorMessage, { cause: error })
	}
}
