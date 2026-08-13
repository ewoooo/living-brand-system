// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { htmlToPng } from '../adapters/html-to-png.client'
import { executeStudioExport, type StudioExportSource } from './execute-studio-export'
import {
	canExportTemplate,
	createTemplateExportRequest,
	createTemplateRasterArtifact,
	type TemplateExportContext,
	type TemplateExportMetadata,
} from './export-template'
import {
	createTemplateExportSource,
	exportTemplatePng,
	exportTemplateTiff,
} from './export-template.client'
import { requestTemplatePrint, TemplatePrintDownloadError } from './export-template-print.client'

vi.mock('../adapters/html-to-png.client', () => ({ htmlToPng: vi.fn() }))
vi.mock('./export-template-print.client', () => ({
	requestTemplatePrint: vi.fn(),
	TemplatePrintDownloadError: class extends Error {},
}))

const metadata: TemplateExportMetadata = {
	fileName: '브랜드 카드',
	printPpi: 300,
	templateId: 12,
	templateVersion: '2026-07-29',
	controller: { groups: [], values: {} },
}
const context: TemplateExportContext = {
	capability: { formats: ['png', 'tiff', 'pdf'] },
	metadata,
}
const artifact = createTemplateRasterArtifact({
	height: 300,
	html: '<div id="__stage">카드</div>',
	width: 600,
})

describe('template export source', () => {
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
		expect(
			canExportTemplate(png, { ...context, metadata: { ...metadata, printPpi: undefined } }),
		).toBe(true)
		expect(
			canExportTemplate(pdf, { ...context, metadata: { ...metadata, printPpi: undefined } }),
		).toBe(false)
		expect(
			canExportTemplate(pdf, {
				...context,
				metadata: { ...metadata, templateVersion: undefined },
			}),
		).toBe(false)
		expect(
			canExportTemplate(tiff, {
				...context,
				metadata: { ...metadata, templateVersion: undefined },
			}),
		).toBe(false)
		expect(canExportTemplate(tiff, context)).toBe(true)
		expect(canExportTemplate(png, { ...context, metadata: null })).toBe(false)
		expect(createTemplateExportRequest('svg', 300)).toBeNull()
	})

	it('Raster Artifact를 형식별 adapter에 실행 시점에 전달한다', async () => {
		const png = createTemplateExportRequest('png')
		const pdf = createTemplateExportRequest('pdf', 300)
		const tiff = createTemplateExportRequest('tiff', 300)
		if (!png || !pdf || !tiff) throw new Error('fixture request is missing')
		const produce = vi.fn(() => artifact)
		const source = createTemplateExportSource(produce, context)
		await expect(executeStudioExport(source, png)).resolves.toMatchObject({
			filename: '브랜드 카드.png',
			mimeType: 'image/png',
		})
		expect(htmlToPng).toHaveBeenCalledWith(
			artifact.source.html,
			artifact.source.width,
			artifact.source.height,
			png.options,
		)
		expect(produce).toHaveBeenCalledOnce()

		await executeStudioExport(source, pdf)
		expect(requestTemplatePrint).toHaveBeenCalledWith({
			colorProfile: 'cgats21-crpc6',
			fileName: metadata.fileName,
			format: 'pdf',
			png: expect.any(Blob),
			templateId: metadata.templateId,
			templateVersion: metadata.templateVersion,
		})

		await executeStudioExport(source, tiff)
		expect(requestTemplatePrint).toHaveBeenCalledWith({
			colorProfile: 'cgats21-crpc6',
			fileName: metadata.fileName,
			format: 'tiff',
			png: expect.any(Blob),
			templateId: metadata.templateId,
			templateVersion: metadata.templateVersion,
		})
	})

	it('producer를 실행할 때마다 최신 합성 HTML을 캡처한다', async () => {
		const png = createTemplateExportRequest('png')
		if (!png) throw new Error('fixture request is missing')
		let html = '<div>첫 프레임</div>'
		const source = createTemplateExportSource(
			() => createTemplateRasterArtifact({ ...artifact.source, html }),
			context,
		)

		await executeStudioExport(source, png)
		html = '<div>최신 그래픽 프레임</div>'
		await executeStudioExport(source, png)

		expect(htmlToPng).toHaveBeenNthCalledWith(
			2,
			'<div>최신 그래픽 프레임</div>',
			artifact.source.width,
			artifact.source.height,
			png.options,
		)
	})

	it('metadata 또는 adapter가 없으면 I/O 전에 중단한다', async () => {
		const tiff = createTemplateExportRequest('tiff', 300)
		if (tiff?.format !== 'tiff') throw new Error('fixture request is missing')
		const produce = vi.fn(() => artifact)
		await expect(
			exportTemplateTiff(tiff, artifact, { ...context, capability: { formats: ['png'] } }),
		).rejects.toThrow('TIFF export is unavailable.')
		await expect(
			exportTemplateTiff(tiff, artifact, { ...context, metadata: null }),
		).rejects.toThrow('TIFF export is unavailable.')
		await expect(
			executeStudioExport(
				createTemplateExportSource(produce, { ...context, metadata: null }),
				tiff,
			),
		).rejects.toThrow('TIFF export is unavailable.')
		expect(() =>
			executeStudioExport(
				createTemplateExportSource(() => artifact, context) as StudioExportSource,
				{
					format: 'jpeg',
					colorProfile: { space: 'rgb', icc: 'srgb' },
					options: { quality: 90 },
				},
			),
		).toThrow('JPEG export is unavailable.')
		expect(htmlToPng).not.toHaveBeenCalled()
		expect(requestTemplatePrint).not.toHaveBeenCalled()
		expect(produce).not.toHaveBeenCalled()
	})

	it('adapter 오류를 공통 메시지로 정리하되 인쇄 출력 조치 메시지는 보존한다', async () => {
		const png = createTemplateExportRequest('png')
		const tiff = createTemplateExportRequest('tiff', 300)
		if (png?.format !== 'png' || tiff?.format !== 'tiff') {
			throw new Error('fixture request is missing')
		}
		vi.mocked(htmlToPng).mockRejectedValueOnce(new Error('DOM capture failed.'))
		await expect(exportTemplatePng(png, artifact, context)).rejects.toThrow(
			'PNG 내보내기에 실패했습니다.',
		)

		vi.mocked(requestTemplatePrint).mockRejectedValueOnce(
			new TemplatePrintDownloadError('템플릿이 변경되었습니다.'),
		)
		await expect(exportTemplateTiff(tiff, artifact, context)).rejects.toThrow(
			'템플릿이 변경되었습니다.',
		)
	})
})
