// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer'
import { toBlob, toPng } from 'html-to-image'
import { PDFDocument } from 'pdf-lib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	canExportTemplate,
	exportHtmlToPng,
	exportTemplate,
	exportTemplatePdf,
	renderHtmlToPngBlob,
	type TemplateExportContext,
} from './export-template.client'

vi.mock('html-to-image', () => ({ toBlob: vi.fn(), toPng: vi.fn() }))

const context: TemplateExportContext = {
	fileName: '브랜드 카드',
	height: 300,
	html: '<div id="__stage">카드</div>',
	printPpi: 300,
	templateId: 12,
	templateVersion: '2026-07-29',
	width: 600,
}

describe('template export dispatch', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(toBlob).mockResolvedValue(new Blob(['png']))
		vi.mocked(toPng).mockResolvedValue('data:image/png;base64,')
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('형식별 가용 조건을 한곳에서 판정한다', () => {
		expect(canExportTemplate('png', { ...context, printPpi: undefined })).toBe(true)
		expect(canExportTemplate('pdf', { ...context, printPpi: undefined })).toBe(false)
		expect(canExportTemplate('tiff', { ...context, templateVersion: undefined })).toBe(false)
		expect(canExportTemplate('tiff', context)).toBe(true)
	})

	it('가용하지 않은 형식은 I/O 전에 중단한다', async () => {
		await expect(
			exportTemplate('tiff', { ...context, templateVersion: undefined }),
		).rejects.toThrow('TIFF export is unavailable.')
		expect(toBlob).not.toHaveBeenCalled()
	})

	it('TIFF는 렌더한 PNG를 서버 변환으로 보내고 파일로 내려받는다', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(new Blob(['tiff']), { status: 200 }))
		vi.stubGlobal('fetch', fetchMock)
		vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:template-tiff')
		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		let download = ''
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement,
		) {
			download = this.download
		})

		await exportTemplate('tiff', context)

		expect(toBlob).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			expect.objectContaining({ canvasHeight: 300, canvasWidth: 600, pixelRatio: 1 }),
		)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('/api/templates/export-tiff')
		const form = init.body as FormData
		expect(form.get('templateId')).toBe('12')
		expect(form.get('templateVersion')).toBe('2026-07-29')
		expect(download).toBe('브랜드 카드.tiff')
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:template-tiff')
	})

	it('adapter 오류를 공통 메시지로 정리하되 TIFF 조치 메시지는 보존한다', async () => {
		vi.mocked(toPng).mockRejectedValueOnce(new Error('DOM capture failed.'))
		await expect(exportTemplate('png', context)).rejects.toThrow('PNG 내보내기에 실패했습니다.')

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 409 })))
		await expect(exportTemplate('tiff', context)).rejects.toThrow('템플릿이 변경되었습니다.')
	})
})

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

	it('TIFF·PDF 변환용 PNG는 흰 배경과 원본 픽셀 크기로 렌더한다', async () => {
		await renderHtmlToPngBlob(
			'<div id="__stage" style="width:1200px;height:800px"></div>',
			'',
			1200,
			800,
		)

		expect(toBlob).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			expect.objectContaining({
				backgroundColor: '#fff',
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

const TRANSPARENT_PNG =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X8WZ5QAAAABJRU5ErkJggg=='

describe('exportTemplatePdf', () => {
	beforeEach(() => {
		vi.stubGlobal('Blob', NodeBlob)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('원본 픽셀과 PPI로 계산한 단일 페이지 PDF를 직접 다운로드한다', async () => {
		let output: Blob | undefined
		let download = ''
		vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
			if (!(blob instanceof Blob)) throw new Error('PDF output must be a Blob.')
			output = blob
			return 'blob:template-pdf'
		})
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement,
		) {
			download = this.download
		})

		await exportTemplatePdf({
			fileName: '브랜드 카드',
			height: 300,
			png: new Blob(
				[Uint8Array.from(atob(TRANSPARENT_PNG), (character) => character.charCodeAt(0))],
				{ type: 'image/png' },
			),
			ppi: 300,
			width: 600,
		})

		expect(output?.type).toBe('application/pdf')
		expect(download).toBe('브랜드 카드.pdf')
		if (!output) throw new Error('PDF blob was not created.')

		const pdf = await PDFDocument.load(new Uint8Array(await output.arrayBuffer()))
		expect(pdf.getPageCount()).toBe(1)
		expect(pdf.getPage(0).getSize()).toEqual({ height: 72, width: 144 })
	})
})
