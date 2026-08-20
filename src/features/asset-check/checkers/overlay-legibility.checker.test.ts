import { describe, expect, it } from 'vitest'
import { measureOverlayLegibility } from './overlay-legibility.checker'
import { getChecker } from './registry'
import type { CheckerContext, PixelGrid } from './types'

const W = 40
const H = 40

/** 단색 배경 그리드. paint(x,y)가 값을 주면 그 픽셀을 그 회색조로 덮는다. */
function grid(bg: number, paint?: (x: number, y: number) => number | undefined): PixelGrid {
	const pixels = []
	const alpha = new Uint8Array(W * H).fill(255)
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const v = paint?.(x, y) ?? bg
			pixels.push({ r: v, g: v, b: v })
		}
	}
	return { width: W, height: H, pixels, alpha }
}

/** x=10..13 · y=2..37에 세로 흰 막대. 면적 144px = 판의 9%로 배경 필터(15%)를 통과한다. */
const bar = (x: number, y: number) => (x >= 10 && x <= 13 && y >= 2 && y <= 37 ? 255 : undefined)

function measured(result: ReturnType<typeof measureOverlayLegibility>) {
	if (result.state !== 'measured') throw new Error(`측정 실패: ${result.reasonCode}`)
	return result.measurements
}

describe('measureOverlayLegibility', () => {
	it('어두운 배경 위 흰 오버레이는 대비가 높다', () => {
		const m = measured(measureOverlayLegibility(grid(26, bar)))
		expect(m.p05ContrastRatio).toBeGreaterThan(10)
	})

	it('🔑 배경 전체가 오버레이와 비슷하면 오버레이로 인정하지 않는다', () => {
		// 픽셀만으로는 「묻힌 오버레이」와 「오버레이 없음」이 구별되지 않는다 → 담당자 검토로 보낸다.
		const buried = measureOverlayLegibility(grid(200, bar))
		expect(buried.state).toBe('not_measurable')
		if (buried.state === 'not_measurable') {
			expect(buried.reasonCode).toBe('overlay_not_detected')
		}
	})

	it('🔑 일부 구간만 묻히면 중앙값은 통과하고 하위 5%가 떨어진다', () => {
		// 배경 하단 20%만 밝다 — 심볼은 보이는데 글자만 묻히는 실제 사례의 모형.
		const m = measured(
			measureOverlayLegibility(
				grid(26, (x, y) => (bar(x, y) ? 255 : y >= 32 ? 200 : undefined)),
			),
		)
		expect(m.p50ContrastRatio).toBeGreaterThan(10)
		expect(m.p05ContrastRatio).toBeLessThan(3)
	})

	it('대조군 — 사진처럼 흔들리는 밝은 면은 오버레이로 잡지 않는다', () => {
		// 색은 흰색 허용 범위 안(245~255)이지만 이웃과 항상 4 이상 어긋나 평탄하지 않다.
		const noisy = measureOverlayLegibility(grid(0, (x, y) => 245 + ((x * 4 + y * 4) % 11)))
		expect(noisy.state).toBe('not_measurable')
		if (noisy.state === 'not_measurable') {
			expect(noisy.reasonCode).toBe('overlay_not_detected')
		}
	})

	it('대조군 — 오버레이 색이 없으면 측정하지 않는다', () => {
		const flat = measureOverlayLegibility(grid(128))
		expect(flat.state).toBe('not_measurable')
	})

	it('🔴 판 배경이 흰색이면 그 면은 오버레이가 아니다', () => {
		// 흰 판만 있는 경우: 판을 덮는 평면은 오버레이가 아니므로 측정 대상이 없다.
		const page = measureOverlayLegibility(grid(255))
		expect(page.state).toBe('not_measurable')
	})

	it('🔑 흰 판 위 검정 글자는 판을 빼고 글자만 잰다', () => {
		const m = measured(
			measureOverlayLegibility(grid(255, (x, y) => (bar(x, y) ? 0 : undefined))),
		)
		// 검정 막대 ↔ 흰 판 = 21:1
		expect(m.p05ContrastRatio).toBeGreaterThan(20)
	})
})

describe('overlay-legibility 등록', () => {
	const options = {
		criteria: [{ measurement: 'p05ContrastRatio', operator: 'gte', expected: 3 }],
	}

	it('기준이 유효하면 등록되고, 일부가 묻힌 배경에서 fail로 판정된다', () => {
		const checker = getChecker('overlay-legibility', options)
		expect(checker?.executor).toBe('deterministic')
		// 어두운 배경에 밝은 띠 — 실제 실패 형태(심볼은 보이는데 글자가 묻힘)와 같은 모형.
		const partly = grid(26, (x, y) => (bar(x, y) ? 255 : y >= 32 ? 200 : undefined))
		const ctx = { pixels: [], palette: [], detailGrid: partly } as CheckerContext
		const result = checker?.executor === 'deterministic' ? checker.run(ctx, options) : null
		expect(result?.status).toBe('fail')
	})

	it('어두운 배경에서는 pass로 판정된다', () => {
		const checker = getChecker('overlay-legibility', options)
		const ctx = { pixels: [], palette: [], detailGrid: grid(26, bar) } as CheckerContext
		const result = checker?.executor === 'deterministic' ? checker.run(ctx, options) : null
		expect(result?.status).toBe('pass')
	})

	it('🔴 고해상도 그리드가 없으면 판정하지 않는다', () => {
		const checker = getChecker('overlay-legibility', options)
		const ctx = { pixels: [], palette: [] } as CheckerContext
		const result = checker?.executor === 'deterministic' ? checker.run(ctx, options) : null
		expect(result?.status).toBe('needs_review')
		expect(result?.reasonCode).toBe('raster_not_available')
	})

	it('기준이 잘못되면 등록되지 않는다', () => {
		expect(getChecker('overlay-legibility', { criteria: [] })).toBeNull()
	})
})
