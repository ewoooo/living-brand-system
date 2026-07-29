// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { printTemplatePdf } from './print-template-pdf.client'

describe('printTemplatePdf', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('PPI로 계산한 단일 mm 페이지에 원본 HTML을 벡터 배율로 인쇄한다', async () => {
		let capturedCss = ''
		let capturedHtml = ''
		let capturedTitle = ''
		let capturedTransform = ''
		const print = vi.fn(function (this: Window) {
			capturedCss = this.document.head.textContent ?? ''
			capturedHtml = this.document.body.textContent ?? ''
			capturedTitle = this.document.title
			capturedTransform = (
				this.document.body.firstElementChild?.firstElementChild as HTMLElement
			).style.transform
		})
		const originalAppendChild = document.body.appendChild.bind(document.body)
		vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => {
			const appended = originalAppendChild(node)
			if (node instanceof HTMLIFrameElement && node.contentWindow) {
				Object.defineProperties(node.contentWindow, {
					focus: { configurable: true, value: vi.fn() },
					print: { configurable: true, value: print },
					requestAnimationFrame: {
						configurable: true,
						value: (callback: FrameRequestCallback) => {
							callback(0)
							return 1
						},
					},
				})
			}
			return appended
		}) as typeof document.body.appendChild)

		await printTemplatePdf({
			fileName: '인쇄 카드',
			height: 300,
			html: '<div id="__stage" style="width:600px;height:300px"><p>벡터 문구</p></div>',
			ppi: 300,
			width: 600,
		})

		expect(print).toHaveBeenCalledOnce()
		expect(capturedCss).toContain('@page { size: 50.8mm 25.4mm; margin: 0; }')
		expect(capturedCss).toContain('background: #fff')
		expect(capturedTransform).toBe('scale(0.32)')
		expect(capturedHtml).toContain('벡터 문구')
		expect(capturedTitle).toBe('인쇄 카드')
		expect(print.mock.instances[0]?.frameElement).toHaveAttribute(
			'sandbox',
			'allow-modals allow-same-origin',
		)
		expect(document.body.querySelector('iframe')).toBeNull()
	})
})
