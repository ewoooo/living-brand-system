// @vitest-environment jsdom
import { toJpeg } from 'html-to-image'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elementToJpeg } from './element-to-jpeg.client'

vi.mock('html-to-image', () => ({ toJpeg: vi.fn() }))

describe('elementToJpeg', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('품질과 자연 크기를 JPEG 변환기에 전달한다', async () => {
		vi.mocked(toJpeg).mockResolvedValue('data:image/jpeg;base64,AA==')
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['jpeg'])) }),
		)
		const element = document.createElement('div')

		await elementToJpeg(element, { width: 600, height: 300, quality: 90, scale: 1 })

		expect(toJpeg).toHaveBeenCalledWith(
			element,
			expect.objectContaining({ canvasWidth: 600, canvasHeight: 300, quality: 0.9 }),
		)
	})

	it('변환 결과를 읽지 못하면 실패한다', async () => {
		vi.mocked(toJpeg).mockResolvedValue('data:image/jpeg;base64,AA==')
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

		await expect(
			elementToJpeg(document.createElement('div'), {
				width: 600,
				height: 300,
				quality: 90,
				scale: 1,
			}),
		).rejects.toThrow('JPEG 변환 결과를 읽지 못했습니다.')
	})
})
