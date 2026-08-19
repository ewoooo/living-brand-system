// @vitest-environment jsdom
import { toBlob } from 'html-to-image'
import { describe, expect, it, vi } from 'vitest'
import { elementToPng } from './element-to-png.client'

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }))

describe('elementToPng', () => {
	it('크기·배율·배경 옵션을 PNG 변환기에 전달한다', async () => {
		vi.mocked(toBlob).mockResolvedValue(new Blob())
		const element = document.createElement('div')

		await elementToPng(element, {
			height: 300,
			scale: 2,
			transparent: false,
			width: 600,
		})

		expect(toBlob).toHaveBeenCalledWith(
			element,
			expect.objectContaining({
				backgroundColor: '#fff',
				// 배율은 pixelRatio 한 곳만 갖는다 — canvasWidth에도 곱하면 제곱으로 커진다.
				canvasHeight: 300,
				canvasWidth: 600,
				pixelRatio: 2,
			}),
		)
	})
})
