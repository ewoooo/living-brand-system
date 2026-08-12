// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import { elementToPng } from './element-to-png.client'
import { htmlToPng } from './html-to-png.client'

vi.mock('./element-to-png.client', () => ({ elementToPng: vi.fn() }))

const OPTIONS = { scale: 1, transparent: true }

describe('htmlToPng', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(elementToPng).mockResolvedValue(new Blob())
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('오프스크린 오프셋이 걸린 holder가 아니라 콘텐츠 노드를 캡처한다', async () => {
		// html-to-image는 캡처 노드의 computed style을 클론에 복사하므로,
		// position:fixed;left:-99999px인 holder를 캡처하면 캔버스 밖에 그려져 투명 PNG가 된다.
		await htmlToPng(
			'<div data-node-id="1:1" style="width:1280px;height:720px">사원 카드</div>',
			1280,
			720,
			OPTIONS,
		)

		const captured = vi.mocked(elementToPng).mock.calls[0]?.[0] as HTMLElement
		expect(captured.style.position).not.toBe('fixed')
		expect(captured.textContent).toContain('사원 카드')
	})

	it('#__stage가 있으면 그 노드를 캡처한다', async () => {
		await htmlToPng('<div id="__stage"><p>배치 결과</p></div>', 1200, 800, OPTIONS)

		const captured = vi.mocked(elementToPng).mock.calls[0]?.[0] as HTMLElement
		expect(captured.id).toBe('__stage')
	})

	it('TIFF·PDF 변환용 PNG는 흰 배경과 원본 픽셀 크기로 렌더한다', async () => {
		await htmlToPng('<div id="__stage" style="width:1200px;height:800px"></div>', 1200, 800, {
			scale: 1,
			transparent: false,
		})

		expect(elementToPng).toHaveBeenCalledWith(expect.any(HTMLElement), {
			height: 800,
			scale: 1,
			transparent: false,
			width: 1200,
		})
	})

	it('이벤트 핸들러가 있는 샌드박스 HTML을 부모 DOM으로 옮기지 않는다', async () => {
		await expect(
			htmlToPng(
				'<div id="__stage"><img src="/api/brand-logos/file/logo.png" onerror="alert(1)"></div>',
				1200,
				800,
				OPTIONS,
			),
		).rejects.toThrow('event handler')

		expect(elementToPng).not.toHaveBeenCalled()
		expect(document.body.querySelector('img')).toBeNull()
	})

	it('발행 자산 컬렉션 generated-images의 CSS 배경 이미지 URL을 허용한다', async () => {
		// jsdom은 리소스를 로드하지 않으므로 배경 이미지 로드 완료 상태를 흉내 낸다.
		vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
		HTMLImageElement.prototype.decode = () => Promise.resolve()

		await htmlToPng(
			'<div id="__stage" style="background-image:url(/api/generated-images/file/bg.png)">배치 결과</div>',
			1200,
			800,
			OPTIONS,
		)

		expect(elementToPng).toHaveBeenCalledOnce()
	})

	it('캔버스 배경이 깔린 합성 HTML을 unsafe URL 없이 내보낸다', async () => {
		// jsdom은 리소스를 로드하지 않으므로 배경 이미지 로드 완료 상태를 흉내 낸다.
		vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
		HTMLImageElement.prototype.decode = () => Promise.resolve()

		// compose가 루트 프레임에 쓰는 선언(색·생성 이미지 url·cover)이 stage 검증을 통과해야 한다.
		const html = composeTemplateHtml(
			'<div data-node-id="1:1" data-figma-type="FRAME" style="width:400px;height:300px"></div>',
			{},
			{
				canvasBackground: {
					color: '#ffffff',
					imageUrl: '/api/generated-images/file/canvas.png',
				},
			},
		)

		await htmlToPng(html, 400, 300, OPTIONS)

		expect(elementToPng).toHaveBeenCalledOnce()
	})

	it('외부 이미지 URL을 가진 샌드박스 HTML을 거부한다', async () => {
		await expect(
			htmlToPng(
				'<div id="__stage"><img src="https://attacker.example/tracker.png"></div>',
				1200,
				800,
				OPTIONS,
			),
		).rejects.toThrow('unsafe image URL')

		expect(elementToPng).not.toHaveBeenCalled()
	})
})
