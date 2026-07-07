/**
 * Checker 스냅샷 테스트 — 7개 checker의 pass/fail 판정을 고정한다.
 * palette-match(deltaE) 교체 같은 색 수학 변경 시 판정이 뒤집히지 않는지 잡는 회귀 안전망.
 * 픽스처 팔레트는 brand-colors 실데이터(Essenherb)의 부분집합이다.
 */
import { describe, expect, it } from 'vitest'
import { colorCombinationChecker } from './color/color-combination.checker'
import { paletteComplianceChecker } from './color/palette-compliance.checker'
import { hexToRgb, type Rgb, type Swatch } from './color/palette-match'
import { spotColorChecker } from './color/spot-color.checker'
import { aspectRatioChecker } from './geometry/aspect-ratio.checker'
import { clearSpaceChecker } from './geometry/clear-space.checker'
import { relativeSizeChecker } from './geometry/relative-size.checker'
import { backgroundToneChecker } from './imagery/background-tone.checker'
import type { PixelGrid } from './types'

const PALETTE: Swatch[] = [
	{ name: 'Essenherb Red', hex: '#EA5343', family: 'red' },
	{ name: 'Red 1', hex: '#FFF0EB', family: 'red' },
	{ name: 'Red 2', hex: '#FFB4AA', family: 'red' },
	{ name: 'Red 4', hex: '#871400', family: 'red' },
	{ name: 'Red 5', hex: '#460500', family: 'red' },
	{ name: 'Blue 3', hex: '#3C87CD', family: 'blue' },
	{ name: 'Blue 5', hex: '#001941', family: 'blue' },
	{ name: 'Gray 1', hex: '#FAFAFA', family: 'gray' },
	{ name: 'Gray 5', hex: '#151515', family: 'gray' },
	{ name: 'White', hex: '#FFFFFF', family: 'extreme' },
	{ name: 'Black', hex: '#000000', family: 'extreme' },
]

/** hex → 픽셀 n개 (dominantColors가 점유율을 보므로 개수 비율 = share) */
function px(hex: string, n: number): Rgb[] {
	return Array.from({ length: n }, () => hexToRgb(hex))
}

/** 단색 배경 위 단색 사각형 grid (alpha 전부 불투명) */
function makeGrid(
	width: number,
	height: number,
	bgHex: string,
	rect?: { x: number; y: number; w: number; h: number; hex: string },
): PixelGrid {
	const bg = hexToRgb(bgHex)
	const fg = rect ? hexToRgb(rect.hex) : bg
	const pixels: Rgb[] = new Array(width * height)
	const alpha = new Uint8Array(width * height).fill(255)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const inRect =
				rect && x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h
			pixels[y * width + x] = inRect ? fg : bg
		}
	}
	return { width, height, pixels, alpha }
}

describe('paletteComplianceChecker (color.palette)', () => {
	it('팔레트 색만 쓰면 pass', () => {
		const result = paletteComplianceChecker.check({
			pixels: [...px('#EA5343', 60), ...px('#FFFFFF', 40)],
			palette: PALETTE,
		})
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
	})

	it('규정 외 색이 지배적이면 fail', () => {
		const result = paletteComplianceChecker.check({
			pixels: [...px('#EA5343', 70), ...px('#00FF00', 30)],
			palette: PALETTE,
		})
		expect(result.status).toBe('fail')
	})

	it('팔레트 색에 가까운 변형(약간 다른 red)은 스냅되어 pass', () => {
		// EA5343에서 소폭 이탈 — deltaE 허용 오차 안이어야 한다.
		const result = paletteComplianceChecker.check({
			pixels: px('#E85140', 100),
			palette: PALETTE,
		})
		expect(result.status).toBe('pass')
	})
})

describe('colorCombinationChecker (color.combination)', () => {
	it('단일 red 계열 + 극단색은 모노/톤온톤으로 pass', () => {
		const result = colorCombinationChecker.check({
			pixels: [...px('#EA5343', 50), ...px('#FFB4AA', 30), ...px('#FFFFFF', 20)],
			palette: PALETTE,
		})
		expect(result.status).toBe('pass')
	})

	it('다계열이라도 명도 대비가 충분하면 톤인톤 근사로 pass', () => {
		const result = colorCombinationChecker.check({
			pixels: [...px('#EA5343', 60), ...px('#001941', 40)],
			palette: PALETTE,
		})
		expect(result.status).toBe('pass')
	})

	it('다계열 + 명도 대비 부족이면 fail', () => {
		const result = colorCombinationChecker.check({
			pixels: [...px('#EA5343', 60), ...px('#3C87CD', 40)],
			palette: PALETTE,
		})
		expect(result.status).toBe('fail')
	})

	it('팔레트 외 색이 있으면 조합 평가 불가로 fail', () => {
		const result = colorCombinationChecker.check({
			pixels: [...px('#EA5343', 60), ...px('#00FF00', 40)],
			palette: PALETTE,
		})
		expect(result.status).toBe('fail')
		expect(result.detail).toContain('조합 평가 불가')
	})
})

describe('spotColorChecker (application.print.spec)', () => {
	it('Essenherb Red + White만 쓰면 pass', () => {
		const result = spotColorChecker.check({
			pixels: [...px('#EA5343', 50), ...px('#FFFFFF', 50)],
			palette: PALETTE,
		})
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
	})

	it('팔레트 안이라도 Red+White 외 색(Gray 5)이 섞이면 fail', () => {
		const result = spotColorChecker.check({
			pixels: [...px('#EA5343', 40), ...px('#FFFFFF', 30), ...px('#151515', 30)],
			palette: PALETTE,
		})
		expect(result.status).toBe('fail')
	})
})

describe('backgroundToneChecker (imagery.background.tone)', () => {
	it('밝은 무채색 배경은 pass', () => {
		const result = backgroundToneChecker.check({ pixels: px('#FAFAFA', 100), palette: PALETTE })
		expect(result.status).toBe('pass')
	})

	it('어둡고 채도 높은 배경은 fail', () => {
		const result = backgroundToneChecker.check({ pixels: px('#EA5343', 100), palette: PALETTE })
		expect(result.status).toBe('fail')
	})
})

describe('aspectRatioChecker (application.stationery.format)', () => {
	it('명함 비율(90:50)이면 pass (방향 무관)', () => {
		const grid = makeGrid(900, 500, '#FFFFFF')
		const result = aspectRatioChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('pass')
	})

	it('정사각형이면 fail', () => {
		const grid = makeGrid(500, 500, '#FFFFFF')
		const result = aspectRatioChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('fail')
	})
})

describe('relativeSizeChecker (logo.size.minimum)', () => {
	it('로고가 프레임 대비 충분히 크면 pass', () => {
		const grid = makeGrid(100, 100, '#FFFFFF', { x: 40, y: 40, w: 20, h: 20, hex: '#EA5343' })
		const result = relativeSizeChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('pass')
	})

	it('로고가 너무 작으면 fail', () => {
		const grid = makeGrid(100, 100, '#FFFFFF', { x: 48, y: 48, w: 4, h: 4, hex: '#EA5343' })
		const result = relativeSizeChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('fail')
	})
})

describe('clearSpaceChecker (logo.space.clear)', () => {
	it('여백이 모듈(stem×3) 이상이면 pass', () => {
		// stem=10 → 모듈 30px, 여백 40px
		const grid = makeGrid(90, 90, '#FFFFFF', { x: 40, y: 40, w: 10, h: 10, hex: '#EA5343' })
		const result = clearSpaceChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('pass')
	})

	it('여백이 모듈보다 좁으면 fail', () => {
		// stem=30 → 모듈 90px, 여백 30px
		const grid = makeGrid(90, 90, '#FFFFFF', { x: 30, y: 30, w: 30, h: 30, hex: '#EA5343' })
		const result = clearSpaceChecker.check({ pixels: [], palette: PALETTE, grid })
		expect(result.status).toBe('fail')
	})
})
