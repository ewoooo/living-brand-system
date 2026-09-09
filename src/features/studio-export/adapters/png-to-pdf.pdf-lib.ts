import { PDFDocument } from 'pdf-lib'
import { millimetersToPdfPoints } from '../print-policy'

/**
 * PNG를 지정한 mm × mm 크기의 단일 페이지 PDF로 싣는다.
 *
 * 🔴 **CMYK로 바꾸지 않는다.** PDF 안의 CMYK JPEG은 Illustrator에서 색이 반전돼 열리는
 *    알려진 결함이 있다 — pdf-lib·jsPDF·Prawn에 각각 보고돼 있고 Adobe 버그 트래커에도 올라가
 *    있으며, 라이브러리 층에서 고칠 방법이 없다. 실물로도 확인했다(초록 판이 마젠타로 열렸다).
 *    그래서 인쇄 PDF는 **일단 RGB로 낸다** — 화면·SVG와 같은 그림이 열리는 것이 우선이다.
 * 🔑 CMYK 파이프라인(`png-to-cmyk-jpeg`·`rgb-to-cmyk`·`scene-images-to-cmyk`·`cmyk-jpeg-to-pdf`)은
 *    지우지 않고 남겨 뒀다. TIFF는 계속 CMYK로 나가고, PDF의 색 관리는 별도 작업으로 되돌린다.
 */
export async function createRgbPrintPdf({
	heightMm,
	png,
	widthMm,
}: {
	heightMm: number
	png: Buffer
	widthMm: number
}): Promise<Buffer | null> {
	try {
		const pdf = await PDFDocument.create()
		// 🔴 `embedPng`는 다루지 못하는 PNG(16bit·인터레이스 등)에서 던진다. 밖으로 새면 라우트가
		//    500을 내는데, 이건 서버 결함이 아니라 **입력 문제**다 — TIFF 분기와 같이 null로 답해
		//    호출부가 400을 내게 한다.
		const image = await pdf.embedPng(Uint8Array.from(png))
		const page = pdf.addPage([
			millimetersToPdfPoints(widthMm),
			millimetersToPdfPoints(heightMm),
		])
		const { height, width } = page.getSize()
		page.drawImage(image, { height, width, x: 0, y: 0 })
		return Buffer.from(await pdf.save())
	} catch {
		return null
	}
}
