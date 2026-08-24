import { describe, expect, it } from 'vitest'
import { slotHighlightCss } from './slot-highlight-css'

const HD_BLUE = '#003087'

describe('slotHighlightCss', () => {
	it('미리보기 아래의 nodeId만 겨냥한다 — data-node-id는 어드민 캔버스에도 있다', () => {
		const css = slotHighlightCss('1:23', 1, HD_BLUE)
		expect(css).toContain(
			'[data-slot="template-preview"] [data-node-id="1:23"]{position:relative;',
		)
		expect(css).toContain(
			'[data-slot="template-preview"] [data-node-id="1:23"]:not(img)::after{',
		)
	})

	it('요소가 아니라 ::after에 그린다 — 인라인 style이 의사요소를 못 덮는다', () => {
		const css = slotHighlightCss('n', 1, HD_BLUE)
		const before = css.slice(0, css.indexOf('::after'))
		expect(css).toContain(':not(img)::after{')
		expect(before).not.toContain('border:')
	})

	it('img 슬롯은 요소 자신에 그린다 — replaced element에는 의사요소가 없다', () => {
		const css = slotHighlightCss('n', 1, HD_BLUE)
		expect(css).toContain(`img[data-node-id="n"]{outline:`)
		expect(css).toContain('outline-offset:calc(-1 * max(1px')
		// 같은 색·같은 면을 두 갈래가 함께 쓴다 — 한쪽만 고쳐지는 것을 막는다.
		expect(css.match(/color-mix\(in srgb, #003087 18%, transparent\)/g)).toHaveLength(2)
	})

	it('테두리는 진하게, 면은 같은 색의 반투명으로 낸다', () => {
		const css = slotHighlightCss('n', 1, HD_BLUE)
		expect(css).toContain(`solid ${HD_BLUE}`)
		expect(css).toContain(`color-mix(in srgb, ${HD_BLUE} 18%, transparent)`)
	})

	it('총배율의 두 번째 몫(--preview-scale)을 CSS에 남긴다 — 보정을 한쪽만 하면 선이 절반이 된다', () => {
		expect(slotHighlightCss('n', 0.5, HD_BLUE)).toContain(
			'calc(1px / (0.5 * var(--preview-scale, 1)))',
		)
	})

	it('두께를 그 단위로만 잰다 — 생 px을 박지 않는다', () => {
		expect(slotHighlightCss('n', 0.5, HD_BLUE)).toContain(
			'border:max(1px, calc(2 * var(--slot-highlight-unit))) solid',
		)
	})

	it('측정 전(scale 0)에도 유효한 배율을 낸다', () => {
		expect(slotHighlightCss('n', 0, HD_BLUE)).toContain(
			'calc(1px / (1 * var(--preview-scale, 1)))',
		)
	})

	it('색을 못 받으면 브랜드 주입을 받는 토큰으로 폴백한다', () => {
		for (const missing of [null, undefined, '']) {
			const css = slotHighlightCss('n', 1, missing)
			expect(css).toContain('solid var(--primary)')
			expect(css).toContain('color-mix(in srgb, var(--primary) 18%, transparent)')
		}
	})

	it('hex 형태가 아닌 값은 선언에 넣지 않는다 — 값은 DB에서 온다', () => {
		for (const hostile of ['red}body{display:none', '#12', 'var(--x)', '#gggggg']) {
			const css = slotHighlightCss('n', 1, hostile)
			expect(css).not.toContain(hostile)
			expect(css).toContain('solid var(--primary)')
		}
	})

	it('따옴표를 이스케이프해 선택자를 깨지 않는다', () => {
		expect(slotHighlightCss('a"]{color:red}[b', 1, HD_BLUE)).toContain(
			'[data-node-id="a\\"]{color:red}[b"]',
		)
	})
})
