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

	it('총배율의 두 번째 몫(--preview-scale)을 CSS에 남긴다 — 보정을 한쪽만 하면 선이 절반이 된다', () => {
		const css = slotHighlightCss('n', 0.5)
		expect(css).toContain('calc(1px / (0.5 * var(--preview-scale, 1)))')
	})

	it('두께와 팔 길이를 그 단위로만 잰다 — 생 px을 박지 않는다', () => {
		const css = slotHighlightCss('n', 0.5)
		expect(css).toContain('border:max(1px, calc(2 * var(--slot-bracket-unit))) solid')
		expect(css).toContain('min(calc(14 * var(--slot-bracket-unit)), 30%)')
	})

	it('측정 전(scale 0)에도 유효한 배율을 낸다', () => {
		expect(slotHighlightCss('n', 0)).toContain('calc(1px / (1 * var(--preview-scale, 1)))')
	})

	it('팔이 요소 절반을 넘어 브래킷이 이어지는 것을 30%로 막는다', () => {
		expect(slotHighlightCss('n', 0.1)).toContain(', 30%)')
	})

	it('따옴표를 이스케이프해 선택자를 깨지 않는다', () => {
		expect(slotHighlightCss('a"]{color:red}[b', 1)).toContain(
			'[data-node-id="a\\"]{color:red}[b"]',
		)
	})
})
