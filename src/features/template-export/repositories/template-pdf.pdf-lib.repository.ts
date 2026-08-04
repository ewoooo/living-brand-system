import { PDFDocument } from 'pdf-lib'
import { millimetersToPdfPoints } from '../print-policy'

/** CMYK JPEG를 지정한 mm × mm 크기의 단일 페이지 PDF로 직렬화한다. */
export async function createTemplatePdf({
	cmykJpeg,
	heightMm,
	widthMm,
}: {
	cmykJpeg: Buffer
	heightMm: number
	widthMm: number
}): Promise<Buffer> {
	const pdf = await PDFDocument.create()
	const image = await pdf.embedJpg(Uint8Array.from(cmykJpeg))
	const page = pdf.addPage([millimetersToPdfPoints(widthMm), millimetersToPdfPoints(heightMm)])
	const { height, width } = page.getSize()

	page.drawImage(image, { height, width, x: 0, y: 0 })

	return Buffer.from(await pdf.save())
}
