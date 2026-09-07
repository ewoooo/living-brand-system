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
	// 🔴 pdf-lib은 4채널 JPEG에 조건 없이 `Decode [1 0 1 0 1 0 1 0]`을 심는다(자기 주석에 「hedge」).
	//    Adobe가 만든 CMYK JPEG이 값을 뒤집어 저장하는 관행을 되돌리려는 보정인데, ICCBased(N=4)의
	//    기본 Decode는 [0 1]×4라서 그 보정만 남는다. sharp가 붙인 APP14 Adobe 마커를 보고 Illustrator·
	//    Acrobat이 스스로 한 번 반전하므로 이중 반전 → 초록이 마젠타로 열렸다(실물 확인).
	//    macOS Preview는 마커를 그렇게 대접하지 않아 정상으로 보인다 — 뷰어마다 다른 것이 이 버그의 지문이다.
	imageStream.dict.delete(PDFName.of('Decode'))
	const page = pdf.addPage([millimetersToPdfPoints(widthMm), millimetersToPdfPoints(heightMm)])
	const { height, width } = page.getSize()

	page.drawImage(image, { height, width, x: 0, y: 0 })

	return Buffer.from(await pdf.save())
}
