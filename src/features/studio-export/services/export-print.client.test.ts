// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestPrintExport } from './export-print.client'

describe('requestPrintExport', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('형식과 PPI를 공통 인쇄 경로로 보낸다', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			blob: () => Promise.resolve(new Blob(['pdf'])),
			ok: true,
			status: 200,
		})
		vi.stubGlobal('fetch', fetchMock)
		await expect(
			requestPrintExport({
				colorProfile: 'cgats21-crpc6',
				fileName: '브랜드 카드',
				format: 'pdf',
				png: new Blob(['png'], { type: 'image/png' }),
				ppi: 300,
			}),
		).resolves.toBeInstanceOf(Blob)
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/studio-exports/print/pdf',
			expect.objectContaining({ method: 'POST' }),
		)
		const form = fetchMock.mock.calls[0]?.[1]?.body as FormData
		expect(form.get('ppi')).toBe('300')
		expect(form.get('image')).toBeInstanceOf(File)
	})
})
