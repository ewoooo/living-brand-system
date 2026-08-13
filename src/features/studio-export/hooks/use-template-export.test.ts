// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createTemplateRasterArtifact } from '@/features/template-customization/runtime/template-runtime.client'
import { renderHtmlRasterArtifactToPng } from '../services/export-artifact.client'
import { requestTemplatePrint } from '../services/export-template-print.client'
import { useTemplateExport } from './use-template-export'

vi.mock('../adapters/download-export-result.client', () => ({
	downloadExportResult: vi.fn(),
}))
vi.mock('../services/export-artifact.client', () => ({
	exportHtmlRasterArtifactAsJpeg: vi.fn(),
	exportHtmlRasterArtifactAsPng: vi.fn(),
	renderHtmlRasterArtifactToPng: vi.fn().mockResolvedValue(new Blob(['png'])),
}))
vi.mock('../services/export-template-print.client', () => ({
	requestTemplatePrint: vi.fn().mockResolvedValue(new Blob(['pdf'])),
	TemplatePrintDownloadError: class extends Error {},
}))

describe('useTemplateExport', () => {
	it('Template 권한 metadata만 print port에 전달하고 변환은 Raster leaf에 맡긴다', async () => {
		const artifact = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () => artifact,
				capability: { formats: ['pdf'], colorProfiles: { cmyk: ['cgats21-crpc6'] } },
				metadata: {
					fileName: 'card',
					printPpi: 300,
					templateId: 12,
					templateVersion: 'v1',
					controller: { groups: [], values: {} },
				},
			}),
		)

		act(() => result.current.run())
		await waitFor(() => expect(requestTemplatePrint).toHaveBeenCalledOnce())

		expect(renderHtmlRasterArtifactToPng).toHaveBeenCalledWith(artifact, {
			scale: 1,
			transparent: false,
		})
		expect(requestTemplatePrint).toHaveBeenCalledWith(
			expect.objectContaining({ templateId: 12, templateVersion: 'v1', format: 'pdf' }),
		)
	})
})
