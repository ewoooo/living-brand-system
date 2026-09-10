// @vitest-environment node
// 🔴 jsdom에서는 pdf-lib이 node Buffer를 자기 realm의 Uint8Array로 못 알아본다. 제품은 서버에서만
//    도는 경로라 이 파일만 node 환경으로 돈다.
import { inflateSync } from 'node:zlib'
import { PDFArray, PDFDocument, PDFHexString, PDFName, PDFRawStream } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { vectorSceneToPdf } from './vector-scene-to-pdf.pdf-lib'

const printOptions = {
	cmyk: {
		colors: new Map(),
		iccProfile: Buffer.alloc(0),
		iccProfileName: 'cgats21-crpc6',
		images: new Map(),
	},
	ppi: 150,
}

const box = (x: number): VectorPrimitive => ({
	fill: '#00AF41',
	height: 20,
	kind: 'rect',
	width: 20,
	x,
	y: 0,
})

const group = (label: string, children: VectorPrimitive[]): VectorPrimitive => ({
	children,
	kind: 'group',
	label,
})

/** 실측 판 모양: 루트 프레임 하나가 이름 붙은 자식들을 감싼다. */
function plate(children: VectorPrimitive[]): VectorScene {
	return {
		background: '#ffffff',
		height: 100,
		primitives: [group('Poster', children)],
		width: 200,
	}
}

async function load(pdf: Buffer) {
	return PDFDocument.load(new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength))
}

/** OCG 이름을 되읽는다. 한글이 깨지면 여기서 드러난다. */
async function layerNames(pdf: Buffer): Promise<string[]> {
	const doc = await load(pdf)
	const names: string[] = []
	for (const [, object] of doc.context.enumerateIndirectObjects()) {
		if (!('get' in object) || typeof object.get !== 'function') continue
		if (String(object.get(PDFName.of('Type'))) !== '/OCG') continue
		const raw = object.get(PDFName.of('Name'))
		names.push(raw instanceof PDFHexString ? raw.decodeText() : String(raw))
	}
	return names
}

async function pageContent(pdf: Buffer): Promise<string> {
	const doc = await load(pdf)
	const node = doc.getPage(0).node
	const contents = doc.context.lookup(node.get(PDFName.of('Contents')))
	const refs =
		contents instanceof PDFArray ? contents.asArray() : [node.get(PDFName.of('Contents'))]
	let stream = ''
	for (const ref of refs) {
		const found = doc.context.lookup(ref)
		if (found instanceof PDFRawStream)
			stream += `${inflateSync(Buffer.from(found.contents)).toString('latin1')}\n`
	}
	return stream
}

/**
 * 🔴 Illustrator는 PDF에서 레이어를 **Optional Content Group**으로만 읽는다(이 맥의 Adobe 산출
 * PDF 33개가 만장일치). 씬은 요소마다 이름 붙은 그룹을 만들지만 예전에는 PDF 직렬화에서 그것을
 * 버려서, 디자이너가 열면 이름 없는 패스 무더기가 됐다 — 「로고가 온갖 패스로 찢어짐」이 그것이다.
 */
describe('벡터 PDF의 레이어(OCG)', () => {
	it('루트 프레임의 자식만 레이어가 된다', async () => {
		const pdf = await vectorSceneToPdf(
			plate([
				box(0),
				group('Title', [box(30)]),
				group('CI', [box(60), box(90)]),
				// 깊이 3은 평탄화된다 — 실측 12판에서 객체 하나짜리 래퍼뿐이었다.
				group('Image Area', [group('Image', [box(120)])]),
			]),
			printOptions,
		)

		const names = await layerNames(pdf)

		expect(names).toEqual(['Title', 'CI', 'Image Area'])
		// 판 프레임을 레이어로 만들면 판당 레이어가 1개가 되어 아무것도 해결하지 않는다.
		expect(names).not.toContain('Poster')
		// 깊이 3.
		expect(names).not.toContain('Image')
	})

	/**
	 * 🔴 이름은 `PDFHexString.fromText`여야 한다. `PDFName`·`PDFString`은 한글을 깨뜨리는데
	 * 그 손상은 **PDF를 열어 보지 않으면 안 보인다** — 도형은 정상이고 레이어 이름만 쓰레기가 된다.
	 */
	it('한글 레이어 이름이 온전히 실린다', async () => {
		const pdf = await vectorSceneToPdf(
			plate([group('제목 한글 레이어', [box(0)])]),
			printOptions,
		)

		expect(await layerNames(pdf)).toEqual(['제목 한글 레이어'])
	})

	/** 🔴 BDC/EMC 짝은 우리가 맞춘다 — pdf-lib은 검사하지 않고, 깨지면 PDF 자체가 열리지 않는다. */
	it('BDC와 EMC가 짝을 맞추고 중첩이 겹치지 않는다', async () => {
		const content = await pageContent(
			await vectorSceneToPdf(
				plate([
					group('Title', [box(0)]),
					{ children: [box(30)], kind: 'group', label: 'Dim', opacity: 0.4 },
				]),
				printOptions,
			),
		)

		const begins = content.match(/\/OC \/MC\d+ BDC/g) ?? []
		const ends = content.match(/(?:^|\s)EMC(?:\s|$)/g) ?? []
		expect(begins).toHaveLength(2)
		expect(ends).toHaveLength(begins.length)
		// 🔑 BDC는 q/Q **밖**이다 — 알파를 EMC 전에 pop해야 다음 레이어로 새지 않는다.
		expect(content).toMatch(/\/OC \/MC1 BDC\s+q/)
	})

	/** 🔴 이 키가 `g`·`G`면 출구 검사기(`cmyk-only`)가 회색조 연산자로 오탐한다. */
	it('Properties 키가 회색조 연산자로 오해되지 않는다', async () => {
		const pdf = await vectorSceneToPdf(plate([group('Title', [box(0)])]), printOptions)
		const doc = await load(pdf)
		const properties = doc
			.getPage(0)
			.node.normalizedEntries()
			.Resources.get(PDFName.of('Properties'))

		expect(String(properties)).toMatch(/MC0/)
		expect(String(properties)).not.toMatch(/\/[gG]\b/)
	})

	/** 그룹이 없는 씬(graphic 런타임)에는 레이어 선언을 만들지 않는다 — 빈 키를 남기지 않는다. */
	it('그룹이 없으면 OCProperties를 만들지 않는다', async () => {
		const pdf = await vectorSceneToPdf(
			{ background: '#ffffff', height: 100, primitives: [box(0)], width: 200 },
			printOptions,
		)
		const doc = await load(pdf)

		expect(doc.catalog.get(PDFName.of('OCProperties'))).toBeUndefined()
		expect(await layerNames(pdf)).toEqual([])
	})
})
