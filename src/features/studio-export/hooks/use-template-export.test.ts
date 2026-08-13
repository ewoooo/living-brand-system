// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createTemplateRasterArtifact } from '@/features/template-customization/runtime/template-runtime.client'
import { executeArtifactExport } from '../services/export-artifact.client'
import { useTemplateExport } from './use-template-export'

vi.mock('../adapters/download-export-result.client', () => ({
	downloadExportResult: vi.fn(),
}))
vi.mock('../services/export-artifact.client', () => ({
	executeArtifactExport: vi.fn().mockResolvedValue({
		data: new Blob(['pdf']),
		filename: 'card.pdf',
		mimeType: 'application/pdf',
	}),
}))

describe('useTemplateExport', () => {
	it('Template은 Raster Artifact와 공통 Print request만 executor에 전달한다', async () => {
		const artifact = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () => artifact,
				capability: {
					formats: ['pdf'],
					colorProfiles: { cmyk: ['cgats21-crpc6'] },
					print: { ppi: [300] },
				},
				metadata: {
					fileName: 'card',
					width: 600,
					height: 300,
					controller: { groups: [], values: {} },
				},
			}),
		)

		act(() => result.current.run())
		await waitFor(() => expect(executeArtifactExport).toHaveBeenCalledOnce())
		expect(executeArtifactExport).toHaveBeenCalledWith(
			expect.objectContaining({
				artifact,
				fileName: 'card',
				request: expect.objectContaining({ artifact: 'raster', format: 'pdf' }),
			}),
		)
	})
})
