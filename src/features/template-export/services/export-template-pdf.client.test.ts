// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer'
import { PDFDocument } from 'pdf-lib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportTemplatePdf } from './export-template-pdf.client'

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
