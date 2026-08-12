import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import { exportImage } from './export-image.client'

vi.mock('../adapters/element-to-jpeg.client', () => ({ elementToJpeg: vi.fn() }))
vi.mock('../adapters/element-to-png.client', () => ({ elementToPng: vi.fn() }))

const SRC = '/api/generated-images/file/line.png'

// jsdom은 리소스를 로드하지 않는다 — 자연 크기를 알려주는 최소 스텁으로 대체한다.
class StubImage {
	naturalWidth = 2048
	naturalHeight = 3072
	private listeners: (() => void)[] = []
	addEventListener(type: string, listener: () => void) {
		if (type === 'load') this.listeners.push(listener)
	}
	set src(_value: string) {
		for (const listener of this.listeners) listener()
	}
}

const PNG_REQUEST = {
	format: 'png',
	colorProfile: { space: 'rgb', icc: 'srgb' },
	options: { scale: 1, transparent: true },
	scope: 'selected',
} as const

describe('exportImage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(elementToJpeg).mockResolvedValue(new Blob())
		vi.mocked(elementToPng).mockResolvedValue(new Blob())
		vi.stubGlobal('Image', StubImage)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('원본 요청은 파일 내용을 ExportResult로 반환한다', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				blob: () => Promise.resolve(new Blob(['original'], { type: 'image/png' })),
			}),
		)
		const result = await exportImage(SRC, 0, null, {
			format: 'original',
			options: {},
			scope: 'selected',
		})

		expect(result).toMatchObject({ filename: 'hd-image-1.png', mimeType: 'image/png' })
		expect(elementToPng).not.toHaveBeenCalled()
	})

	it('색이 있으면 자연 크기 스테이지에 색을 구워 PNG로 반환한다', async () => {
		const result = await exportImage(SRC, 1, { line: '#000dff' }, PNG_REQUEST)

		const stage = vi.mocked(elementToPng).mock.calls[0]?.[0] as HTMLElement
		expect(result).toMatchObject({ filename: 'hd-image-2.png', mimeType: 'image/png' })
		// 해상도를 화면 썸네일이 아니라 이미지의 자연 크기에서 가져온다.
		expect(stage.style.width).toBe('2048px')
		expect(stage.style.height).toBe('3072px')
		const overlay = stage.firstElementChild as HTMLElement
		expect(overlay.style.maskComposite).toBe('subtract')
		expect(overlay.style.maskImage).toContain(SRC)
	})

	it('색 선언을 문자열 HTML 재파싱 없이 DOM stage에 적용한다', async () => {
		await exportImage(SRC, 0, { line: '#000dff', background: '#00ffd4' }, PNG_REQUEST)

		const stage = vi.mocked(elementToPng).mock.calls[0]?.[0] as HTMLElement
		const overlay = stage.firstElementChild as HTMLElement
		expect(stage.style.backgroundColor).toBe('rgb(0, 13, 255)')
		expect(overlay.style.maskImage).toContain(SRC)
		expect(overlay.style.maskMode).toBe('luminance')
	})

	it('JPEG 요청은 품질과 자연 크기를 전용 변환기에 전달한다', async () => {
		const result = await exportImage(SRC, 0, null, {
			format: 'jpeg',
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { quality: 90 },
			scope: 'selected',
		})

		expect(elementToJpeg).toHaveBeenCalledWith(expect.any(HTMLElement), {
			height: 3072,
			quality: 90,
			width: 2048,
		})
		expect(result).toMatchObject({ filename: 'hd-image-1.jpg', mimeType: 'image/jpeg' })
	})
})
