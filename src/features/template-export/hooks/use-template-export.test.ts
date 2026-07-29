// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportTemplatePdf } from '../services/export-template-pdf.client'
import {
	downloadTemplateTiff,
	TemplateTiffDownloadError,
} from '../services/export-template-tiff.client'
import { exportHtmlToPng, renderHtmlToPngBlob } from '../services/render-template-html.client'
import { useTemplateExport } from './use-template-export'

vi.mock('../services/export-template-tiff.client', () => ({
	downloadTemplateTiff: vi.fn(),
	TemplateTiffDownloadError: class extends Error {},
}))
vi.mock('../services/export-template-pdf.client', () => ({ exportTemplatePdf: vi.fn() }))
vi.mock('../services/render-template-html.client', () => ({
	exportHtmlToPng: vi.fn(),
	renderHtmlToPngBlob: vi.fn(),
}))

const input = {
	fileName: '브랜드 카드',
	height: 300,
	html: '<div id="__stage">카드</div>',
	printPpi: 300 as const,
	templateId: 12,
	templateVersion: '2026-07-29',
	width: 600,
}

describe('useTemplateExport', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(renderHtmlToPngBlob).mockResolvedValue(new Blob(['png']))
	})

	it('png | tiff | pdf 형식을 각 export service로 전달한다', async () => {
		const { result } = renderHook(() => useTemplateExport(input))

		await act(() => result.current.exportTemplate('png'))
		expect(exportHtmlToPng).toHaveBeenCalledWith(input.html, '', input.fileName)

		await act(() => result.current.exportTemplate('tiff'))
		expect(downloadTemplateTiff).toHaveBeenCalledWith({
			fileName: input.fileName,
			png: expect.any(Blob),
			templateId: input.templateId,
			templateVersion: input.templateVersion,
		})

		await act(() => result.current.exportTemplate('pdf'))
		expect(exportTemplatePdf).toHaveBeenCalledWith({
			fileName: input.fileName,
			height: input.height,
			png: expect.any(Blob),
			ppi: input.printPpi,
			width: input.width,
		})
		expect(result.current.exporting).toBeNull()
		expect(result.current.exportError).toBeNull()
	})

	it('형식별 오류를 공통 계약으로 반환한다', async () => {
		vi.mocked(downloadTemplateTiff).mockRejectedValue(
			new TemplateTiffDownloadError('템플릿이 변경되었습니다.'),
		)
		const { result } = renderHook(() => useTemplateExport(input))

		await act(() => result.current.exportTemplate('tiff'))

		expect(result.current.exportError).toBe('템플릿이 변경되었습니다.')
		expect(result.current.exporting).toBeNull()
	})
})
