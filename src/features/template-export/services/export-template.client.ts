'use client'

import type { PrintPpi } from '../print-policy'
import { exportTemplatePdf } from './export-template-pdf.client'
import { exportHtmlToPng, renderHtmlToPngBlob } from './export-template-png.client'
import { downloadTemplateTiff, TemplateTiffDownloadError } from './export-template-tiff.client'

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
	isAvailable: (context: TemplateExportContext) => boolean
	run: (context: TemplateExportContext) => Promise<void>
}

const exportErrorMessages = {
	png: 'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
	pdf: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
	tiff: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
} satisfies Record<TemplateExportFormat, string>

async function exportTemplateAsPng(context: TemplateExportContext): Promise<void> {
	await exportHtmlToPng(context.html, '', context.fileName)
}

async function exportTemplateAsPdf(context: TemplateExportContext): Promise<void> {
	if (!context.printPpi) throw new Error('PDF export requires print PPI.')

	const png = await renderHtmlToPngBlob(context.html, '', context.width, context.height)
	await exportTemplatePdf({
		fileName: context.fileName,
		height: context.height,
		png,
		ppi: context.printPpi,
		width: context.width,
	})
}

async function exportTemplateAsTiff(context: TemplateExportContext): Promise<void> {
	if (!context.printPpi || !context.templateVersion) {
		throw new Error('TIFF export requires print PPI and template version.')
	}

	const png = await renderHtmlToPngBlob(context.html, '', context.width, context.height)
	await downloadTemplateTiff({
		fileName: context.fileName,
		png,
		templateId: context.templateId,
		templateVersion: context.templateVersion,
	})
}

const exporters = {
	png: {
		isAvailable: () => true,
		run: exportTemplateAsPng,
	},
	pdf: {
		isAvailable: ({ printPpi }) => Boolean(printPpi),
		run: exportTemplateAsPdf,
	},
	tiff: {
		isAvailable: ({ printPpi, templateVersion }) => Boolean(printPpi && templateVersion),
		run: exportTemplateAsTiff,
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
		if (format === 'tiff' && error instanceof TemplateTiffDownloadError) throw error
		throw new Error(exportErrorMessages[format], { cause: error })
	}
}
