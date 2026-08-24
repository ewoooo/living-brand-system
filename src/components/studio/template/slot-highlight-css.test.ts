import { describe, expect, it } from 'vitest'
import { slotHighlightCss } from './slot-highlight-css'

describe('slotHighlightCss', () => {
	it('미리보기 아래의 nodeId만 겨냥한다 — data-node-id는 어드민 캔버스에도 있다', () => {
		const css = slotHighlightCss('1:23', 1)
		expect(css).toContain(
			'[data-slot="template-preview"] [data-node-id="1:23"]{position:relative}',
		)
		expect(css).toContain('[data-slot="template-preview"] [data-node-id="1:23"]::after{')
	})

	it('요소가 아니라 ::after에 그린다 — 인라인 style이 의사요소를 못 덮는다', () => {
		const css = slotHighlightCss('n', 1)
		// 브래킷을 그리는 선언(border·box-shadow·mask)은 전부 ::after 뒤에 있어야 한다.
		const after = css.slice(css.indexOf('::after'))
		for (const declaration of ['border:', 'box-shadow:', 'mask:']) {
			expect(after).toContain(declaration)
			expect(css.slice(0, css.indexOf('::after'))).not.toContain(declaration)
		}
	})

	it('네 모서리를 mask 4겹으로 남긴다', () => {
		const css = slotHighlightCss('n', 1)
		for (const corner of ['left top', 'right top', 'left bottom', 'right bottom']) {
			expect(css).toContain(corner)
		}
	})

	it('어느 바탕에서도 읽히게 대비 짝을 두 겹으로 낸다 — 캔버스는 앱 테마를 안 따른다', () => {
		const css = slotHighlightCss('n', 1)
		expect(css).toContain('var(--primary)')
		expect(css).toContain('var(--primary-foreground)')
	})

	it('축소 렌더에서 선이 사라지지 않게 두께와 팔 길이를 scale로 나눈다', () => {
		const css = slotHighlightCss('n', 0.5)
		expect(css).toContain('border:4px solid')
		expect(css).toContain('min(28px, 30%)')
	})

	it('확대 렌더에서도 하한을 지킨다', () => {
		const css = slotHighlightCss('n', 4)
		expect(css).toContain('border:1px solid')
		expect(css).toContain('min(6px, 30%)')
	})

	it('측정 전(scale 0)에도 유효한 값을 낸다', () => {
		const css = slotHighlightCss('n', 0)
		expect(css).toContain('border:2px solid')
		expect(css).toContain('min(14px, 30%)')
	})

	it('팔이 요소 절반을 넘어 브래킷이 이어지는 것을 30%로 막는다', () => {
		expect(slotHighlightCss('n', 0.1)).toContain('30%)')
	})

	it('따옴표를 이스케이프해 선택자를 깨지 않는다', () => {
		expect(slotHighlightCss('a"]{color:red}[b', 1)).toContain(
			'[data-node-id="a\\"]{color:red}[b"]',
		)
	})
})
