import { describe, expect, it } from 'vitest'
import { slotHighlightCss } from './slot-highlight-css'

describe('slotHighlightCss', () => {
	it('미리보기 아래로 한정한 nodeId 선택자를 만든다', () => {
		expect(slotHighlightCss('1:23', 1)).toBe(
			'[data-slot="template-preview"] [data-node-id="1:23"]{' +
				'outline:2px solid var(--primary);outline-offset:-2px;' +
				'box-shadow:inset 0 0 0 4px var(--primary-foreground)}',
		)
	})

	it('어느 바탕에서도 읽히게 대비 짝을 두 겹으로 낸다 — 캔버스는 앱 테마를 안 따른다', () => {
		const css = slotHighlightCss('n', 1)
		expect(css).toContain('var(--primary)')
		expect(css).toContain('var(--primary-foreground)')
	})

	it('축소 렌더에서 선이 사라지지 않게 두께를 scale로 나눈다', () => {
		expect(slotHighlightCss('n', 0.5)).toContain('outline:4px solid')
	})

	it('확대 렌더에서도 1px 아래로는 내려가지 않는다', () => {
		expect(slotHighlightCss('n', 4)).toContain('outline:1px solid')
	})

	it('측정 전(scale 0)에도 유효한 두께를 낸다', () => {
		expect(slotHighlightCss('n', 0)).toContain('outline:1px solid')
	})

	it('따옴표를 이스케이프해 선택자를 깨지 않는다', () => {
		expect(slotHighlightCss('a"]{color:red}[b', 1)).toContain(
			'[data-node-id="a\\"]{color:red}[b"]',
		)
	})
})
