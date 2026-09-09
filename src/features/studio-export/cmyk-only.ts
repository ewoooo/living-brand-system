import { inflateSync } from 'node:zlib'
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'

/**
 * 만들어진 PDF에 CMYK 아닌 색이 남았는지 찾는다. 비어 있으면 파일 전체가 CMYK 하나다.
 *
 * 🔴 이 검사가 있는 이유: 색 하나만 RGB로 남아도 Illustrator가 「RGB·CMYK 혼재」로 열고 문서
 *    모드를 하나 골라 나머지를 변환한다 — 그러면 **도형의 정본 CMYK 수치가 통째로 깨진다**
 *    (2026-09-09 실측). 상류 분기 하나하나를 믿는 대신 출구에서 한 번 본다.
 * 🔑 색이 들어오는 길이 둘이라 둘 다 본다 — 도형은 content stream의 연산자(`rg`·`g`)로,
 *    사진은 XObject의 `/ColorSpace`로 들어간다. 하나만 보면 나머지가 조용히 통과한다.
 */
export async function findNonCmykColors(pdf: Buffer): Promise<string[]> {
	// 🔴 Buffer를 그대로 넘기지 않는다. pdf-lib은 `instanceof Uint8Array`로 입력을 검사하는데,
	//    node Buffer는 다른 realm(테스트의 jsdom 등)에서 그 검사를 통과하지 못해 타입 오류로
	//    죽는다. 뷰로 감싸면 복사 없이 이 모듈의 realm에 맞춰진다.
	const doc = await PDFDocument.load(new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength))
	const problems: string[] = []

	for (const [index, page] of doc.getPages().entries()) {
		const contents = page.node.get(PDFName.of('Contents'))
		const resolved = doc.context.lookup(contents)
		const refs = resolved instanceof PDFArray ? resolved.asArray() : [contents]
		let content = ''
		for (const ref of refs) {
			const stream = doc.context.lookup(ref)
			if (stream instanceof PDFRawStream) content += `${decode(stream)}\n`
		}
		// 연산자는 공백으로 끊긴 토큰이다 — `gs`·`RG`가 서로 섞이지 않게 경계를 함께 본다.
		const rgb = (content.match(/(?:^|\s)(?:rg|RG)(?:\s|$)/g) ?? []).length
		const gray = (content.match(/(?:^|\s)(?:g|G)(?:\s|$)/g) ?? []).length
		if (rgb > 0) problems.push(`${index + 1}쪽: RGB 도형 ${rgb}개`)
		if (gray > 0) problems.push(`${index + 1}쪽: 회색조 도형 ${gray}개`)
	}

	for (const [, object] of doc.context.enumerateIndirectObjects()) {
		if (!(object instanceof PDFRawStream)) continue
		if (String(object.dict.get(PDFName.of('Subtype'))) !== '/Image') continue
		const space = String(object.dict.get(PDFName.of('ColorSpace')))
		if (/DeviceRGB|DeviceGray|Indexed|CalRGB|CalGray/.test(space))
			problems.push(`이미지 색 공간이 CMYK가 아니다: ${space.replace(/\s+/g, ' ')}`)
	}

	return problems
}

/** flate 스트림을 펼친다. 압축이 아니면 원본 바이트를 그대로 읽는다. */
function decode(stream: PDFRawStream): string {
	const bytes = Buffer.from(stream.contents)
	try {
		return inflateSync(bytes).toString('latin1')
	} catch {
		return bytes.toString('latin1')
	}
}
