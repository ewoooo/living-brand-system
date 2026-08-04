'use client'

import { toBlob, toPng } from 'html-to-image'
import { downloadBlob } from '@/lib/object-url'
import { MAX_PRINT_PNG_BYTES, type PrintPpi } from '../print-policy'
import { withSafeExportStage } from './render-template-export-stage.client'

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

const exportErrorMessages = {
	png: 'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
	pdf: 'PDF 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
	tiff: 'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
} satisfies Record<TemplateExportFormat, string>

/**
 * 템플릿과 출력 정책으로 형식별 export 가능 여부를 판정한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 export 함수가 소유한다.
 */
export function canExportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): boolean {
	switch (format) {
		case 'png':
			return true
		case 'pdf':
			return Boolean(context.printPpi)
		case 'tiff':
			return Boolean(context.printPpi && context.templateVersion)
	}
}

/**
 * 선택한 형식의 client export use case를 실행한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 export 함수가 소유한다.
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
				await exportHtmlToPng(context.html, '', context.fileName)
				return
			case 'pdf':
				await exportTemplatePdf({
					fileName: context.fileName,
					height: context.height,
					png: await renderHtmlToPngBlob(context.html, '', context.width, context.height),
					// canExportTemplate가 printPpi 존재를 보장한다.
					ppi: context.printPpi as PrintPpi,
					width: context.width,
				})
				return
			case 'tiff':
				await downloadTemplateTiff({
					fileName: context.fileName,
					png: await renderHtmlToPngBlob(context.html, '', context.width, context.height),
					templateId: context.templateId,
					// canExportTemplate가 templateVersion 존재를 보장한다.
					templateVersion: context.templateVersion as string,
				})
				return
		}
	} catch (error) {
		if (format === 'tiff' && error instanceof TemplateTiffDownloadError) throw error
		throw new Error(exportErrorMessages[format], { cause: error })
	}
}

/**
 * canonical HTML을 안전한 export stage에서 PNG로 저장하는 client use case.
 * DOM 캡처와 브라우저 다운로드 I/O는 이 함수가 소유한다.
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
 * DOM 캡처 I/O는 이 함수가 소유하며 pixelRatio 1을 강제한다.
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

const PDF_POINTS_PER_INCH = 72

/**
 * 원본 픽셀 PNG를 운영자 PPI의 흰 단일 페이지 RGB PDF로 만들어 다운로드한다.
 * PNG 렌더링은 상위 export use case가, PDF 직렬화와 브라우저 다운로드 I/O는 이 함수가 소유한다.
 */
export async function exportTemplatePdf({
	fileName,
	height,
	png,
	ppi,
	width,
}: {
	fileName: string
	height: number
	png: Blob
	ppi: PrintPpi
	width: number
}): Promise<void> {
	const { PDFDocument, rgb } = await import('pdf-lib')
	const pageWidth = (width / ppi) * PDF_POINTS_PER_INCH
	const pageHeight = (height / ppi) * PDF_POINTS_PER_INCH
	const pdf = await PDFDocument.create()
	const page = pdf.addPage([pageWidth, pageHeight])
	const image = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()))

	page.drawRectangle({
		color: rgb(1, 1, 1),
		height: pageHeight,
		width: pageWidth,
		x: 0,
		y: 0,
	})
	page.drawImage(image, {
		height: pageHeight,
		width: pageWidth,
		x: 0,
		y: 0,
	})

	const bytes = await pdf.save()
	downloadBlob(
		new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }),
		`${fileName}.pdf`,
	)
}

/** 서버 TIFF 변환이 사용자 조치가 가능한 상태로 실패했음을 UI에 전달한다. */
export class TemplateTiffDownloadError extends Error {}

/**
 * 브라우저 PNG를 서버의 템플릿 인쇄 정책으로 변환해 TIFF 파일로 내려받는 client use case.
 * PNG 렌더링은 상위 export use case가, HTTP·브라우저 다운로드 I/O는 이 함수가 소유한다.
 */
export async function downloadTemplateTiff({
	fileName,
	png,
	templateId,
	templateVersion,
}: {
	fileName: string
	png: Blob
	templateId: number
	templateVersion: string
}): Promise<void> {
	if (png.size > MAX_PRINT_PNG_BYTES) {
		throw new TemplateTiffDownloadError(
			'렌더된 PNG가 20MB를 초과합니다. 더 작은 템플릿을 사용해 주세요.',
		)
	}

	const form = new FormData()
	form.set('templateId', String(templateId))
	form.set('templateVersion', templateVersion)
	form.set('image', png, `${fileName}.png`)

	const response = await fetch('/api/templates/export-tiff', {
		body: form,
		method: 'POST',
	})
	if (response.status === 409) {
		throw new TemplateTiffDownloadError(
			'템플릿이 변경되었습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
		)
	}
	if (response.status === 429) {
		throw new TemplateTiffDownloadError(
			'TIFF 내보내기 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
		)
	}
	if (!response.ok) {
		throw new TemplateTiffDownloadError(
			'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
		)
	}

	downloadBlob(await response.blob(), `${fileName}.tiff`)
}
