import { describe, expect, it } from 'vitest'
import { figmaNodeToHtml } from './figma-node-to-html'

// 실제 REST /nodes 응답 형태의 최소 fixture (169:84 3×3 1:2:3 그리드).
const GRID_FRAME = {
	id: '169:84',
	name: 'Frame 35',
	type: 'FRAME',
	background: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
	fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
	layoutMode: 'GRID',
	paddingTop: 40,
	paddingRight: 40,
	paddingBottom: 40,
	paddingLeft: 40,
	gridColumnGap: 10,
	gridRowGap: 10,
	gridColumnsSizing: '   minmax(0,1fr) minmax(0,2fr) minmax(0,3fr)',
	gridRowsSizing: '   minmax(0,1fr) minmax(0,2fr) minmax(0,3fr)',
	gridItemsPositioning: 'ROW_AUTO_FLOW',
	absoluteBoundingBox: { x: 0, y: 0, width: 3110, height: 2195 },
	children: [
		{
			id: '169:87',
			name: '01',
			type: 'TEXT',
			fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
			characters: '01',
			style: {
				fontFamily: 'Inter',
				fontWeight: 400,
				fontSize: 140,
				textAlignHorizontal: 'LEFT',
			},
			gridColumnSpan: 1,
			gridRowSpan: 1,
		},
	],
}

describe('figmaNodeToHtml', () => {
	it('GRID 프레임을 1:2:3 css grid로 옮긴다', () => {
		const { html, width, height } = figmaNodeToHtml(GRID_FRAME)

		expect(width).toBe(3110)
		expect(height).toBe(2195)
		expect(html).toContain('display:grid')
		// gridColumnsSizing 앞 공백은 trim되어 CSS 값 그대로.
		expect(html).toContain('grid-template-columns:minmax(0,1fr) minmax(0,2fr) minmax(0,3fr)')
		expect(html).toContain('grid-template-rows:minmax(0,1fr) minmax(0,2fr) minmax(0,3fr)')
		expect(html).toContain('column-gap:10px')
		expect(html).toContain('padding:40px 40px 40px 40px')
		expect(html).toContain('background:rgb(255,255,255)')
		expect(html).toContain('width:3110px')
	})

	it('TEXT 자식을 폰트·색과 함께 넣고 data-node-id를 붙인다', () => {
		const { html } = figmaNodeToHtml(GRID_FRAME)

		expect(html).toContain('data-node-id="169:87"')
		expect(html).toContain('>01</p>')
		expect(html).toContain('font-size:140px')
		expect(html).toContain('font-family:"Inter"')
		expect(html).toContain('color:rgb(0,0,0)')
	})
})
