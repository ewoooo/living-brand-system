// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestTemplatePrint } from './export-template-print.client'

describe('requestTemplatePrint', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('템플릿 ID와 형식을 통합 경로에 넣고 PNG만 multipart body로 보낸다', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			blob: () => Promise.resolve(new Blob(['pdf'])),
			ok: true,
			status: 200,
		})
		vi.stubGlobal('fetch', fetchMock)
		vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:template-print')
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		await expect(
			requestTemplatePrint({
				colorProfile: 'cgats21-crpc6',
				fileName: '브랜드 카드',
				format: 'pdf',
				png: new Blob(['png'], { type: 'image/png' }),
				templateId: 12,
				templateVersion: '2026-07-29',
			}),
		).resolves.toBeInstanceOf(Blob)

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/templates/12/exports/pdf',
			expect.objectContaining({ method: 'POST' }),
		)
		const form = fetchMock.mock.calls[0]?.[1]?.body as FormData
		expect(form.get('colorProfile')).toBe('cgats21-crpc6')
		expect(form.get('templateId')).toBeNull()
		expect(form.get('templateVersion')).toBe('2026-07-29')
		expect(form.get('image')).toBeInstanceOf(File)
	})
})
