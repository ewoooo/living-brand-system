import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { parseColor, roundedRectPath, vectorSceneToPdf } from './vector-scene-to-pdf.pdf-lib'

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
