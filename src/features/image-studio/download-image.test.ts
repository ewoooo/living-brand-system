import { toBlob } from 'html-to-image'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from '@/lib/object-url'
import { downloadImage } from './download-image'

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }))
vi.mock('@/lib/object-url', () => ({ downloadBlob: vi.fn() }))

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

describe('downloadImage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(toBlob).mockResolvedValue(new Blob())
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
		vi.stubGlobal('Image', StubImage)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('색이 없으면 원본을 앵커 클릭으로 그대로 내려준다', async () => {
		await downloadImage(SRC, 0, null, { formats: ['png'], original: true })

		expect(toBlob).not.toHaveBeenCalled()
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
	})

	it('색이 있으면 자연 크기 스테이지에 색을 구워 PNG로 저장한다', async () => {
		await downloadImage(SRC, 1, { line: '#000dff' }, { formats: ['png'], original: true })

		expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
		const stage = vi.mocked(toBlob).mock.calls[0]?.[0] as HTMLElement
		expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'hd-image-2.png')
		// 해상도를 화면 썸네일이 아니라 이미지의 자연 크기에서 가져온다.
		expect(stage.style.width).toBe('2048px')
		expect(stage.style.height).toBe('3072px')
		const overlay = stage.firstElementChild as HTMLElement
		expect(overlay.style.maskComposite).toBe('subtract')
		expect(overlay.style.maskImage).toContain(SRC)
	})

	it('색 선언을 문자열 HTML 재파싱 없이 DOM stage에 적용한다', async () => {
		await downloadImage(
			SRC,
			0,
			{ line: '#000dff', background: '#00ffd4' },
			{ formats: ['png'], original: true },
		)

		const stage = vi.mocked(toBlob).mock.calls[0]?.[0] as HTMLElement
		const overlay = stage.firstElementChild as HTMLElement
		expect(stage.style.backgroundColor).toBe('rgb(0, 13, 255)')
		expect(overlay.style.maskImage).toContain(SRC)
		expect(overlay.style.maskMode).toBe('luminance')
	})

	it('원본과 PNG가 모두 제한되면 파일 I/O 전에 거부한다', async () => {
		await expect(downloadImage(SRC, 0, null, { formats: [], original: false })).rejects.toThrow(
			'PNG output is unavailable.',
		)
		expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
		expect(toBlob).not.toHaveBeenCalled()
		expect(downloadBlob).not.toHaveBeenCalled()
	})
})
