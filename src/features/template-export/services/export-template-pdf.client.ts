'use client'

import { revokeBlob } from '@/lib/object-url'
import type { PrintPpi } from '../print-policy'

const PDF_POINTS_PER_INCH = 72

/**
 * 원본 픽셀 PNG를 운영자 PPI의 흰 단일 페이지 RGB PDF로 만들어 다운로드한다.
 * PNG 렌더링은 상위 export use case가, PDF 직렬화와 브라우저 다운로드 I/O는 이 adapter가 소유한다.
 */
export async function exportTemplatePdf({
	fileName,
	height,
	png,
	ppi,
	width,
}: {
	fileName: string
	height: number
	png: Blob
	ppi: PrintPpi
	width: number
}): Promise<void> {
	const { PDFDocument, rgb } = await import('pdf-lib')
	const pageWidth = (width / ppi) * PDF_POINTS_PER_INCH
	const pageHeight = (height / ppi) * PDF_POINTS_PER_INCH
	const pdf = await PDFDocument.create()
	const page = pdf.addPage([pageWidth, pageHeight])
	const image = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()))

	page.drawRectangle({
		color: rgb(1, 1, 1),
		height: pageHeight,
		width: pageWidth,
		x: 0,
		y: 0,
	})
	page.drawImage(image, {
		height: pageHeight,
		width: pageWidth,
		x: 0,
		y: 0,
	})

	const bytes = await pdf.save()
	const url = URL.createObjectURL(
		new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }),
	)
	try {
		const link = document.createElement('a')
		link.href = url
		link.download = `${fileName}.pdf`
		link.click()
	} finally {
		revokeBlob(url)
	}
}
