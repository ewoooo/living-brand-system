// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { htmlToPng } from '../adapters/html-to-png.client'
import {
	canExportTemplate,
	createTemplateExportRequest,
	type TemplateExportContext,
} from './export-template'
import { exportTemplate } from './export-template.client'
import { requestTemplatePrint, TemplatePrintDownloadError } from './export-template-print.client'

vi.mock('../adapters/html-to-png.client', () => ({ htmlToPng: vi.fn() }))
vi.mock('./export-template-print.client', () => ({
	requestTemplatePrint: vi.fn(),
	TemplatePrintDownloadError: class extends Error {},
}))

const context: TemplateExportContext = {
	fileName: '브랜드 카드',
	height: 300,
	html: '<div id="__stage">카드</div>',
	output: { formats: ['png', 'tiff', 'pdf'] },
	printPpi: 300,
	templateId: 12,
	templateVersion: '2026-07-29',
	width: 600,
	controller: { groups: [], values: {} },
}

describe('exportTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(htmlToPng).mockResolvedValue(new Blob(['png']))
		vi.mocked(requestTemplatePrint).mockResolvedValue(new Blob(['print']))
	})

	it('형식별 가용 조건을 한곳에서 판정한다', () => {
		const png = createTemplateExportRequest('png')
		const pdf = createTemplateExportRequest('pdf', 300)
		const tiff = createTemplateExportRequest('tiff', 300)
		if (!png || !pdf || !tiff) throw new Error('fixture request is missing')
		expect(canExportTemplate(png, { ...context, printPpi: undefined })).toBe(true)
		expect(canExportTemplate(pdf, { ...context, printPpi: undefined })).toBe(false)
		expect(canExportTemplate(pdf, { ...context, templateVersion: undefined })).toBe(false)
		expect(canExportTemplate(tiff, { ...context, templateVersion: undefined })).toBe(false)
		expect(canExportTemplate(tiff, context)).toBe(true)
		expect(createTemplateExportRequest('svg', 300)).toBeNull()
	})

	it('형식별 adapter에 실행을 위임한다', async () => {
		const png = createTemplateExportRequest('png')
		const pdf = createTemplateExportRequest('pdf', 300)
		const tiff = createTemplateExportRequest('tiff', 300)
		if (!png || !pdf || !tiff) throw new Error('fixture request is missing')
		await expect(exportTemplate(png, context)).resolves.toMatchObject({
			filename: '브랜드 카드.png',
			mimeType: 'image/png',
		})
		expect(htmlToPng).toHaveBeenCalledWith(
			context.html,
			context.width,
			context.height,
			png.options,
		)

		await exportTemplate(pdf, context)
		expect(requestTemplatePrint).toHaveBeenCalledWith({
			colorProfile: 'cgats21-crpc6',
			fileName: context.fileName,
			format: 'pdf',
			png: expect.any(Blob),
			templateId: context.templateId,
			templateVersion: context.templateVersion,
		})

		await exportTemplate(tiff, context)
		expect(requestTemplatePrint).toHaveBeenCalledWith({
			colorProfile: 'cgats21-crpc6',
			fileName: context.fileName,
			format: 'tiff',
			png: expect.any(Blob),
			templateId: context.templateId,
			templateVersion: context.templateVersion,
		})
	})

	it('가용하지 않은 형식은 I/O 전에 중단한다', async () => {
		const tiff = createTemplateExportRequest('tiff', 300)
		if (!tiff) throw new Error('fixture request is missing')
		await expect(
			exportTemplate(tiff, { ...context, output: { formats: ['png'] } }),
		).rejects.toThrow('TIFF export is unavailable.')
		expect(htmlToPng).not.toHaveBeenCalled()
		expect(requestTemplatePrint).not.toHaveBeenCalled()
	})

	it('adapter 오류를 공통 메시지로 정리하되 인쇄 출력 조치 메시지는 보존한다', async () => {
		const png = createTemplateExportRequest('png')
		const tiff = createTemplateExportRequest('tiff', 300)
		if (!png || !tiff) throw new Error('fixture request is missing')
		vi.mocked(htmlToPng).mockRejectedValueOnce(new Error('DOM capture failed.'))
		await expect(exportTemplate(png, context)).rejects.toThrow('PNG 내보내기에 실패했습니다.')

		vi.mocked(requestTemplatePrint).mockRejectedValueOnce(
			new TemplatePrintDownloadError('템플릿이 변경되었습니다.'),
		)
		await expect(exportTemplate(tiff, context)).rejects.toThrow('템플릿이 변경되었습니다.')
	})
})
