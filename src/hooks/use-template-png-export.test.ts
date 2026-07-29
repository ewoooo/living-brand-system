// @vitest-environment jsdom
import { toBlob, toPng } from 'html-to-image'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportHtmlToPng, renderHtmlToPngBlob } from './use-template-png-export'

vi.mock('html-to-image', () => ({ toBlob: vi.fn(), toPng: vi.fn() }))

describe('exportHtmlToPng', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(toBlob).mockResolvedValue(new Blob())
		vi.mocked(toPng).mockResolvedValue('data:image/png;base64,')
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('오프스크린 오프셋이 걸린 holder가 아니라 콘텐츠 노드를 캡처한다', async () => {
		// html-to-image는 캡처 노드의 computed style을 클론에 복사하므로,
		// position:fixed;left:-99999px인 holder를 캡처하면 캔버스 밖에 그려져 투명 PNG가 된다.
		await exportHtmlToPng(
			'<div data-node-id="1:1" style="width:1280px;height:720px">사원 카드</div>',
			'',
			'사원 카드',
		)

		const captured = vi.mocked(toPng).mock.calls[0]?.[0] as HTMLElement
		expect(captured.style.position).not.toBe('fixed')
		expect(captured.textContent).toContain('사원 카드')
	})

	it('#__stage가 있으면 그 노드를 캡처한다', async () => {
		await exportHtmlToPng('<div id="__stage"><p>배치 결과</p></div>', 'p{color:red}', '결과')

		const captured = vi.mocked(toPng).mock.calls[0]?.[0] as HTMLElement
		expect(captured.id).toBe('__stage')
	})

	it('TIFF 변환용 PNG는 원본 픽셀 크기와 pixelRatio 1로 렌더한다', async () => {
		await renderHtmlToPngBlob(
			'<div id="__stage" style="width:1200px;height:800px"></div>',
			'',
			1200,
			800,
		)

		expect(toBlob).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			expect.objectContaining({
				canvasHeight: 800,
				canvasWidth: 1200,
				pixelRatio: 1,
			}),
		)
	})

	it('이벤트 핸들러가 있는 샌드박스 HTML을 부모 DOM으로 옮기지 않는다', async () => {
		await expect(
			exportHtmlToPng(
				'<div id="__stage"><img src="/api/brand-logos/file/logo.png" onerror="alert(1)"></div>',
				'',
				'결과',
			),
		).rejects.toThrow('event handler')

		expect(toPng).not.toHaveBeenCalled()
		expect(document.body.querySelector('img')).toBeNull()
	})

	it('외부 이미지 URL을 가진 샌드박스 HTML을 거부한다', async () => {
		await expect(
			exportHtmlToPng(
				'<div id="__stage"><img src="https://attacker.example/tracker.png"></div>',
				'',
				'결과',
			),
		).rejects.toThrow('unsafe image URL')

		expect(toPng).not.toHaveBeenCalled()
	})

	it('외부 I/O를 일으키는 샌드박스 CSS를 거부한다', async () => {
		await expect(
			exportHtmlToPng(
				'<div id="__stage">배치 결과</div>',
				'@import url("https://attacker.example/collect.css");',
				'결과',
			),
		).rejects.toThrow('unsafe stylesheet I/O')

		expect(toPng).not.toHaveBeenCalled()
	})

	it('CSS escape로 숨긴 import와 URL을 거부한다', async () => {
		await expect(
			exportHtmlToPng(
				'<div id="__stage">배치 결과</div>',
				'@\\69mport "https://attacker.example/collect.css";',
				'결과',
			),
		).rejects.toThrow('unsafe stylesheet I/O')
		await expect(
			exportHtmlToPng(
				'<div id="__stage">배치 결과</div>',
				'#x{background-image:u\\72l("https://attacker.example/pixel.png")}',
				'결과',
			),
		).rejects.toThrow('unsafe stylesheet I/O')

		expect(toPng).not.toHaveBeenCalled()
	})

	it('CSS 태그 탈출 문자열은 스타일 텍스트로만 다룬다', async () => {
		await exportHtmlToPng(
			'<div id="__stage">배치 결과</div>',
			'</style><img src="https://attacker.example/tracker.png">',
			'결과',
		)

		expect(toPng).toHaveBeenCalledOnce()
		expect(document.body.querySelector('img')).toBeNull()
	})
})
