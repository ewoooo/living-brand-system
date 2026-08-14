import { PDFDocument, PDFName, PDFRawStream, PDFString } from 'pdf-lib'
import { millimetersToPdfPoints } from '../print-policy'

/** CMYK JPEG를 지정한 mm × mm 크기의 단일 페이지 PDF로 직렬화한다. */
export async function createPrintPdf({
	cmykJpeg,
	heightMm,
	iccProfile,
	iccProfileName,
	widthMm,
}: {
	cmykJpeg: Buffer
	heightMm: number
	iccProfile: Buffer
	iccProfileName: string
	widthMm: number
}): Promise<Buffer> {
	const pdf = await PDFDocument.create()
	const image = await pdf.embedJpg(Uint8Array.from(cmykJpeg))
	const profile = pdf.context.flateStream(Uint8Array.from(iccProfile), {
		Alternate: 'DeviceCMYK',
		N: 4,
	})
	const profileRef = pdf.context.register(profile)
	const outputIntent = pdf.context.obj({
		Type: 'OutputIntent',
		S: 'GTS_PDFX',
		DestOutputProfile: profileRef,
		Info: PDFString.of(iccProfileName),
		OutputConditionIdentifier: PDFString.of(iccProfileName),
		RegistryName: PDFString.of('https://registry.color.org'),
	})
	pdf.catalog.set(
		PDFName.of('OutputIntents'),
		pdf.context.obj([pdf.context.register(outputIntent)]),
	)
	await image.embed()
	const imageStream = pdf.context.lookup(image.ref)
	if (!(imageStream instanceof PDFRawStream)) throw new Error('CMYK PDF image is missing.')
	imageStream.dict.set(
		PDFName.of('ColorSpace'),
		pdf.context.obj([PDFName.of('ICCBased'), profileRef]),
	)
	const page = pdf.addPage([millimetersToPdfPoints(widthMm), millimetersToPdfPoints(heightMm)])
	const { height, width } = page.getSize()

	page.drawImage(image, { height, width, x: 0, y: 0 })

	return Buffer.from(await pdf.save())
}
