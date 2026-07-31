// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	canExportTemplate,
	exportTemplate,
	type TemplateExportContext,
} from './export-template.client'
import { exportTemplatePdf } from './export-template-pdf.client'
import { exportHtmlToPng, renderHtmlToPngBlob } from './export-template-png.client'
import { downloadTemplateTiff, TemplateTiffDownloadError } from './export-template-tiff.client'

vi.mock('./export-template-pdf.client', () => ({ exportTemplatePdf: vi.fn() }))
vi.mock('./export-template-png.client', () => ({
	exportHtmlToPng: vi.fn(),
	renderHtmlToPngBlob: vi.fn(),
}))
vi.mock('./export-template-tiff.client', () => ({
	downloadTemplateTiff: vi.fn(),
	TemplateTiffDownloadError: class extends Error {},
}))

const context: TemplateExportContext = {
	fileName: '브랜드 카드',
	height: 300,
	html: '<div id="__stage">카드</div>',
	printPpi: 300,
	templateId: 12,
	templateVersion: '2026-07-29',
	width: 600,
}

describe('template export registry', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(renderHtmlToPngBlob).mockResolvedValue(new Blob(['png']))
	})

	it('형식별 가용 조건을 한곳에서 판정한다', () => {
		expect(canExportTemplate('png', { ...context, printPpi: undefined })).toBe(true)
		expect(canExportTemplate('pdf', { ...context, printPpi: undefined })).toBe(false)
		expect(canExportTemplate('tiff', { ...context, templateVersion: undefined })).toBe(false)
		expect(canExportTemplate('tiff', context)).toBe(true)
	})

	it('선택한 exporter에 실행을 위임한다', async () => {
		await exportTemplate('png', context)
		expect(exportHtmlToPng).toHaveBeenCalledWith(context.html, '', context.fileName)

		await exportTemplate('pdf', context)
		expect(exportTemplatePdf).toHaveBeenCalledWith({
			fileName: context.fileName,
			height: context.height,
			png: expect.any(Blob),
			ppi: context.printPpi,
			width: context.width,
		})

		await exportTemplate('tiff', context)
		expect(downloadTemplateTiff).toHaveBeenCalledWith({
			fileName: context.fileName,
			png: expect.any(Blob),
			templateId: context.templateId,
			templateVersion: context.templateVersion,
		})
	})

	it('가용하지 않은 형식은 I/O 전에 중단한다', async () => {
		await expect(
			exportTemplate('tiff', { ...context, templateVersion: undefined }),
		).rejects.toThrow('TIFF export is unavailable.')
		expect(renderHtmlToPngBlob).not.toHaveBeenCalled()
		expect(downloadTemplateTiff).not.toHaveBeenCalled()
	})

	it('adapter 오류를 공통 메시지로 정리하되 TIFF 조치 메시지는 보존한다', async () => {
		vi.mocked(exportHtmlToPng).mockRejectedValueOnce(new Error('DOM capture failed.'))
		await expect(exportTemplate('png', context)).rejects.toThrow('PNG 내보내기에 실패했습니다.')

		vi.mocked(downloadTemplateTiff).mockRejectedValueOnce(
			new TemplateTiffDownloadError('템플릿이 변경되었습니다.'),
		)
		await expect(exportTemplate('tiff', context)).rejects.toThrow('템플릿이 변경되었습니다.')
	})
})
