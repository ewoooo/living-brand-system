import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportHtmlToPng } from '@/features/template-export/services/export-template-png.client'
import { downloadImage } from './download-image'

vi.mock('@/features/template-export/services/export-template-png.client', () => ({
	exportHtmlToPng: vi.fn(),
}))

const SRC = '/api/generated-images/file/line.png'
const output = { formats: ['png'] as const, original: true }

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
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
		vi.stubGlobal('Image', StubImage)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('색이 없으면 원본을 앵커 클릭으로 그대로 내려준다', async () => {
		await downloadImage(SRC, 0, output)

		expect(exportHtmlToPng).not.toHaveBeenCalled()
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
	})

	it('색이 있으면 자연 크기 스테이지에 색을 구워 PNG로 저장한다', async () => {
		await downloadImage(SRC, 1, output, { line: '#000dff' })

		expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
		const [html, name] = vi.mocked(exportHtmlToPng).mock.calls[0] ?? []
		expect(name).toBe('hd-image-2')
		// 해상도를 화면 썸네일이 아니라 이미지의 자연 크기에서 가져온다.
		expect(html).toContain('width:2048px;height:3072px')
		// 프리뷰와 같은 계산을 직렬화한 것이므로 kebab-case 선언이 그대로 실린다.
		expect(html).toContain('mask-composite:subtract')
		expect(html).toContain(`url('${SRC}')`)
	})

	// 회귀: mask url을 겹따옴표로 감싸면 style="..." 속성이 거기서 끊겨 선언 전체가 사라진다.
	it('구운 HTML의 색 선언이 style 속성 파싱을 통과한다', async () => {
		await downloadImage(SRC, 0, output, { line: '#000dff', background: '#00ffd4' })

		const [html] = vi.mocked(exportHtmlToPng).mock.calls[0] ?? []
		const parsed = document.createElement('template')
		parsed.innerHTML = html ?? ''
		const stage = parsed.content.firstElementChild as HTMLElement
		const overlay = stage.firstElementChild as HTMLElement
		expect(stage.style.backgroundColor).toBe('rgb(0, 13, 255)')
		expect(overlay.style.maskImage).toContain(SRC)
		expect(overlay.style.maskMode).toBe('luminance')
	})

	it('허용되지 않은 원본·PNG는 adapter 실행 전에 중단한다', async () => {
		await expect(downloadImage(SRC, 0, { formats: ['png'], original: false })).rejects.toThrow(
			'Original image export is unavailable.',
		)
		await expect(
			downloadImage(SRC, 0, { formats: [], original: true }, { line: '#000dff' }),
		).rejects.toThrow('PNG image export is unavailable.')
		expect(exportHtmlToPng).not.toHaveBeenCalled()
	})
})
