import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { exportPrint, PrintExportInputError } from './export-print.service'

async function transparentPng(width = 600, height = 300) {
	return sharp({
		create: {
			background: { alpha: 0, b: 0, g: 0, r: 255 },
			channels: 4,
			height,
			width,
		},
	})
		.png()
		.toBuffer()
}

describe('exportPrint', () => {
	it('Raster PNG를 지정 PPI의 CMYK TIFF로 변환한다', async () => {
		const result = await exportPrint({ format: 'tiff', png: await transparentPng(), ppi: 300 })
		await expect(sharp(result).metadata()).resolves.toMatchObject({
			density: 300,
			format: 'tiff',
			height: 300,
			space: 'cmyk',
			width: 600,
		})
	})

	it('Raster PNG를 정확한 mm 페이지 크기의 CMYK PDF로 변환한다', async () => {
		const result = await exportPrint({ format: 'pdf', png: await transparentPng(), ppi: 300 })
		const pdf = await PDFDocument.load(Uint8Array.from(result))
		const page = pdf.getPage(0)
		const image = pdf.context
			.enumerateIndirectObjects()
			.map(([, object]) => object)
			.find(
				(object) =>
					object instanceof PDFRawStream &&
					String(object.dict.get(PDFName.of('Subtype'))) === '/Image',
			)
		expect(page.getWidth()).toBeCloseTo(144)
		expect(page.getHeight()).toBeCloseTo(72)
		expect(image).toBeInstanceOf(PDFRawStream)
		expect(pdf.catalog.get(PDFName.of('OutputIntents'))).toBeDefined()
	})

	it('손상된 PNG를 거부한다', async () => {
		await expect(
			exportPrint({ format: 'tiff', png: Buffer.from('invalid'), ppi: 300 }),
		).rejects.toBeInstanceOf(PrintExportInputError)
	})
})
