import { inflateSync } from 'node:zlib'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { parseColor, roundedRectPath, vectorSceneToPdf } from './vector-scene-to-pdf.pdf-lib'

/** 인쇄 옵션의 색 관련 필드는 페이지 치수와 무관하다 — 치수 검증에서는 빈 값으로 채운다. */
const printOptions = (ppi: number) => ({
	colors: new Map(),
	iccProfile: Buffer.alloc(0),
	iccProfileName: 'cgats21-crpc6',
	ppi,
})

async function pageSize(pdf: Buffer) {
	// 🔴 Buffer를 그대로 주면 jsdom 환경에서 pdf-lib의 타입 검사를 통과하지 못한다.
	const document = await PDFDocument.load(new Uint8Array(pdf), { updateMetadata: false })
	const [page] = document.getPages()
	return { width: page.getWidth(), height: page.getHeight() }
}

/**
 * 페이지의 모든 content stream을 잇는다. `page.scale`은 이미 쌓인 스트림을 **다른 스트림으로
 * 감싸므로**, 가장 긴 스트림 하나만 보면 배율이 안 보인다.
 */
function allContentStreams(pdf: Buffer): string {
	const raw = pdf.toString('latin1')
	const chunks: string[] = []
	for (const match of raw.matchAll(/stream\r?\n/g)) {
		const start = match.index + match[0].length
		const end = raw.indexOf('endstream', start)
		try {
			chunks.push(
				inflateSync(Buffer.from(raw.slice(start, end), 'latin1')).toString('latin1'),
			)
		} catch {}
	}
	return chunks.join('\n')
}

/** PDF의 그리기 명령을 되읽는다 — 좌표·배율은 눈으로 못 보므로 파일에서 확인한다. */
function contentStream(pdf: Buffer): string {
	const raw = pdf.toString('latin1')
	let best = ''
	for (const match of raw.matchAll(/stream\r?\n/g)) {
		const start = match.index + match[0].length
		const end = raw.indexOf('endstream', start)
		try {
			const text = inflateSync(Buffer.from(raw.slice(start, end), 'latin1')).toString(
				'latin1',
			)
			if (text.includes(' cm') && text.length > best.length) best = text
		} catch {}
	}
	return best
}

describe('parseColor', () => {
	// 🔴 못 읽는 색은 undefined가 되어 그 도형이 색 없이 사라진다 — 인쇄물에서 눈치채기 어렵다.
	//    실제로 로고 SVG가 fill="black"으로 들어와 PDF에서만 비었다(2026-08-27).
	it('씬이 약속한 #rrggbb와 흔한 변형을 읽는다', () => {
		expect(parseColor('#00ad45')).toMatchObject({ red: 0, blue: 69 / 255 })
		expect(parseColor('#fff')).toMatchObject({ red: 1, green: 1, blue: 1 })
		expect(parseColor('rgb(0, 173, 69)')).toMatchObject({ red: 0, blue: 69 / 255 })
	})

	it('읽을 수 없으면 undefined다 — 호출부가 색 없음으로 다룬다', () => {
		expect(parseColor('nonsense')).toBeUndefined()
	})
})

describe('roundedRectPath', () => {
	it('반지름이 변의 절반을 넘으면 잘라 낸다', () => {
		expect(roundedRectPath(10, 10, 999)).toContain('M5 0')
	})
})

describe('vectorSceneToPdf', () => {
	// 🔴 배율을 빠뜨리면 SVG는 멀쩡한데 PDF에서만 로고가 viewBox 원본 크기로 찍힌다.
	//    실제로 `scale: 1`이 하드코딩돼 있었고, SVG로 열어 보면 정상이라 눈에 안 잡혔다.
	it('path의 배율과 원점을 PDF 변환 행렬로 옮긴다', async () => {
		const scene: VectorScene = {
			width: 200,
			height: 200,
			background: '#ffffff',
			primitives: [
				{ kind: 'path', d: 'M0 0H100V100H0Z', x: 20, y: 30, scale: 0.5, fill: '#00ad45' },
			],
		}

		const content = contentStream(await vectorSceneToPdf(scene))

		// 원점은 y를 뒤집어 (20, 200-30), 배율은 0.5에 y축 반전이 곱해진다.
		expect(content).toContain('1 0 0 1 20 170 cm')
		expect(content).toContain('0.5 0 0 -0.5 0 0 cm')
	})

	it('배율이 없으면 1로 그린다 — 아웃라인 글자가 그 경우다', async () => {
		const scene: VectorScene = {
			width: 100,
			height: 100,
			background: '#ffffff',
			primitives: [{ kind: 'path', d: 'M0 0H10V10H0Z', x: 0, y: 0, fill: '#000000' }],
		}

		expect(contentStream(await vectorSceneToPdf(scene))).toContain('1 0 0 -1 0 0 cm')
	})
})

describe('벡터 PDF의 페이지 물리 크기', () => {
	// 🔴 px를 pt에 그대로 꽂으면 판이 72ppi라고 선언하는 것이 된다 — A4 판이 381mm로 나갔다.
	const a4At300: VectorScene = {
		width: 2480,
		height: 3508,
		background: '#ffffff',
		primitives: [{ kind: 'path', d: 'M0 0H10V10H0Z', x: 0, y: 0, fill: '#000000' }],
	}

	it('300ppi로 잡은 A4 판이 A4 페이지(595×842pt)로 나간다', async () => {
		const { width, height } = await pageSize(await vectorSceneToPdf(a4At300, printOptions(300)))
		expect(width).toBeCloseTo(595.2, 0)
		expect(height).toBeCloseTo(841.9, 0)
	})

	it('해상도를 바꾸면 같은 씬이 다른 물리 크기로 나간다', async () => {
		const { width } = await pageSize(await vectorSceneToPdf(a4At300, printOptions(72)))
		expect(width).toBeCloseTo(2480, 0)
	})

	it('페이지를 줄이면 내용도 같은 배율로 따라간다 — 판만 줄고 그림이 남으면 안 된다', async () => {
		const content = allContentStreams(await vectorSceneToPdf(a4At300, printOptions(300)))
		expect(content).toContain('0.24 0 0 0.24 0 0 cm')
	})
})
