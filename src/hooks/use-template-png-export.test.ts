// @vitest-environment jsdom
import { toPng } from 'html-to-image'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportHtmlToPng } from './use-template-png-export'

vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

describe('exportHtmlToPng', () => {
	beforeEach(() => {
		vi.clearAllMocks()
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
})
