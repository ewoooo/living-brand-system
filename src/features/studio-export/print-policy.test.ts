import { describe, expect, it } from 'vitest'
import {
	findPrintOutputBlocker,
	isPrintPpi,
	MAX_PRINT_PIXELS,
	MAX_PRINT_PPI,
	MAX_PRINT_SIDE_PIXELS,
	maxPrintSize,
	millimetersToPixels,
	parsePrintPpi,
	pixelsToMillimeters,
	pixelsToPdfPoints,
} from './print-policy'

describe('findPrintOutputBlocker', () => {
	it('인쇄가 활성화된 Artifact의 정수 픽셀 크기와 상한을 검증한다', () => {
		expect(findPrintOutputBlocker({ enabled: true, height: 100, width: 200 })).toBeNull()
		expect(findPrintOutputBlocker({ enabled: true, height: 100.5, width: 200 })).toContain(
			'양의 정수',
		)
		expect(
			findPrintOutputBlocker({
				enabled: true,
				height: MAX_PRINT_SIDE_PIXELS / 2,
				width: MAX_PRINT_SIDE_PIXELS,
			}),
		).toContain(`최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀`)
	})

	it('브라우저 캔버스가 축소하는 16,384px 초과 변은 총 픽셀과 무관하게 차단한다', () => {
		expect(findPrintOutputBlocker({ enabled: true, height: 3000, width: 20000 })).toContain(
			'너비·높이 각각',
		)
		expect(findPrintOutputBlocker({ enabled: true, height: 4096, width: 16384 })).toBeNull()
	})

	it('인쇄가 비활성화된 자산은 픽셀 제한을 적용하지 않는다', () => {
		expect(
			findPrintOutputBlocker({
				height: MAX_PRINT_PIXELS,
				enabled: false,
				width: MAX_PRINT_PIXELS,
			}),
		).toBeNull()
	})
})

describe('인쇄 해상도', () => {
	it('프리셋 밖의 값도 범위 안이면 받는다 — 직접 입력이 조용히 거부되면 안 된다', () => {
		expect(isPrintPpi(300)).toBe(true)
		expect(isPrintPpi(350)).toBe(true)
		expect(isPrintPpi(MAX_PRINT_PPI)).toBe(true)
	})

	it('범위 밖·정수 아님·숫자 아님을 거른다', () => {
		expect(isPrintPpi(0)).toBe(false)
		expect(isPrintPpi(-300)).toBe(false)
		expect(isPrintPpi(300.5)).toBe(false)
		expect(isPrintPpi(MAX_PRINT_PPI + 1)).toBe(false)
		expect(isPrintPpi('300')).toBe(false)
		expect(isPrintPpi(Number.NaN)).toBe(false)
	})

	it('폼으로 들어온 문자열을 숫자로 읽고 잘못된 값은 undefined로 돌린다', () => {
		expect(parsePrintPpi('350')).toBe(350)
		expect(parsePrintPpi('abc')).toBeUndefined()
		expect(parsePrintPpi(null)).toBeUndefined()
	})
})

describe('물리 크기 환산', () => {
	it('mm를 그 해상도로 채우는 픽셀 수로 바꾼다', () => {
		expect(millimetersToPixels(210, 300)).toBe(2480)
		expect(millimetersToPixels(297, 300)).toBe(3508)
		// 같은 판이라도 해상도가 낮으면 픽셀이 준다 — ppi는 태그가 아니라 픽셀 수를 정하는 값이다.
		expect(millimetersToPixels(210, 72)).toBe(595)
	})

	it('px→mm와 왕복해도 인쇄 허용 오차 안에 있다', () => {
		expect(pixelsToMillimeters(millimetersToPixels(210, 300), 300)).toBeCloseTo(210, 1)
	})

	it('PDF 페이지 단위(pt)는 72ppi 고정이 아니라 그 판의 해상도를 따른다', () => {
		// A4를 300ppi로 잡은 판: 2480px → 595pt(=210mm). px를 pt에 그대로 꽂으면 2480pt가 된다.
		expect(pixelsToPdfPoints(2480, 300)).toBeCloseTo(595.2, 1)
		expect(pixelsToPdfPoints(2480, 72)).toBe(2480)
	})
})

describe('maxPrintSize', () => {
	it('A4 비율 판이 300ppi를 낼 수 있을 만큼 크다 — 영상 예산으로 대신하면 여기서 막힌다', () => {
		const limit = maxPrintSize(1080, 1527)
		expect(limit.width).toBeGreaterThanOrEqual(2480)
	})

	it('두 한도를 모두 지킨다 — 변 한도와 총 픽셀은 따로 걸린다', () => {
		for (const [width, height] of [
			[1080, 1527],
			[600, 1800],
			[16000, 100],
			[1, 1],
		]) {
			const limit = maxPrintSize(width, height)
			expect(limit.width).toBeLessThanOrEqual(MAX_PRINT_SIDE_PIXELS)
			expect(limit.height).toBeLessThanOrEqual(MAX_PRINT_SIDE_PIXELS)
			expect(limit.width * limit.height).toBeLessThanOrEqual(MAX_PRINT_PIXELS)
			expect(findPrintOutputBlocker({ enabled: true, ...limit })).toBeNull()
		}
	})

	it('종횡비를 지킨다', () => {
		const limit = maxPrintSize(1080, 1527)
		expect(limit.width / limit.height).toBeCloseTo(1080 / 1527, 2)
	})
})
