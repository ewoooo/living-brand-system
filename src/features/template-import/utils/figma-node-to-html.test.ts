import { describe, expect, it } from 'vitest'
import { figmaNodeToHtml } from './figma-node-to-html'

// 실제 REST /nodes 응답 형태의 최소 fixture (169:84 3×3 1:2:3 그리드).
const GRID_FRAME = {
	id: '169:84',
	name: 'Frame 35',
	type: 'FRAME',
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
			gridColumnAnchorIndex: 0,
			gridRowAnchorIndex: 0,
			gridColumnSpan: 1,
			gridRowSpan: 1,
			gridChildHorizontalAlign: 'AUTO',
			gridChildVerticalAlign: 'AUTO',
			style: {
				fontFamily: 'Inter',
				fontWeight: 400,
				fontSize: 140,
				textAlignHorizontal: 'LEFT',
				textAutoResize: 'WIDTH_AND_HEIGHT',
				lineHeightPx: 169.43,
				lineHeightUnit: 'INTRINSIC_%',
			},
		},
	],
}

// 첫 자식 <p>의 style="..." 속성값만 뽑는다.
function firstTextStyle(html: string): string {
	return html.match(/<p [^>]*style="([^"]*)"/)?.[1] ?? ''
}
function rootStyle(html: string): string {
	return html.match(/^<(?:div|p) [^>]*style="([^"]*)"/)?.[1] ?? ''
}

describe('figmaNodeToHtml — 레이아웃', () => {
	it('GRID 프레임을 1:2:3 css grid로 옮긴다', () => {
		const { html, width, height } = figmaNodeToHtml(GRID_FRAME)

		expect(width).toBe(3110)
		expect(height).toBe(2195)
		expect(html).toContain('display:grid')
		expect(html).toContain('grid-template-columns:minmax(0,1fr) minmax(0,2fr) minmax(0,3fr)')
		expect(html).toContain('column-gap:10px')
		expect(html).toContain('padding:40px 40px 40px 40px')
		expect(html).toContain('background:rgb(255,255,255)')
		expect(html).toContain('width:3110px')
	})

	it('그리드 자식을 앵커 셀 + span + 정렬로 배치한다', () => {
		const s = firstTextStyle(figmaNodeToHtml(GRID_FRAME).html)
		expect(s).toContain('grid-column:1 / span 1')
		expect(s).toContain('grid-row:1 / span 1')
		expect(s).toContain('justify-self:start')
		expect(s).toContain('align-self:start')
	})

	it('노드 타입을 data-figma-type으로 보존한다', () => {
		const { html } = figmaNodeToHtml(GRID_FRAME)
		expect(html).toContain('data-figma-type="FRAME"')
		expect(html).toContain('data-figma-type="TEXT"')
	})
})

describe('figmaNodeToHtml — 텍스트', () => {
	it('폰트·색·정렬을 넣고 큰따옴표를 이스케이프한다', () => {
		const s = firstTextStyle(figmaNodeToHtml(GRID_FRAME).html)
		expect(s).toContain('color:rgb(0,0,0)')
		expect(s).toContain('font-size:140px')
		expect(s).toContain('text-align:left')
		// font-family의 " 를 &quot;로 이스케이프해야 style="..."가 끊기지 않는다(흰 화면 회귀).
		expect(s).toContain('font-family:&quot;Inter&quot;')
		expect(figmaNodeToHtml(GRID_FRAME).html).not.toContain('font-family:"Inter"')
	})

	it('lineHeightUnit INTRINSIC_%는 normal, WIDTH_AND_HEIGHT는 pre(줄바꿈 보존)', () => {
		const s = firstTextStyle(figmaNodeToHtml(GRID_FRAME).html)
		expect(s).toContain('line-height:normal')
		// nowrap이면 명시 개행이 공백으로 뭉개진다 → pre로 자동 줄바꿈만 끄고 개행은 보존.
		expect(s).toContain('white-space:pre')
		expect(s).not.toContain('white-space:nowrap')
	})

	it('textCase/textDecoration/italic/letterSpacing를 옮긴다', () => {
		const node = {
			id: '1:1',
			name: 't',
			type: 'TEXT',
			characters: 'hi',
			absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 20 },
			style: {
				fontFamily: 'Inter',
				fontSize: 16,
				fontStyle: 'Italic',
				textCase: 'UPPER',
				textDecoration: 'UNDERLINE',
				letterSpacing: 2,
				textAutoResize: 'HEIGHT',
				lineHeightUnit: 'PIXELS',
				lineHeightPx: 24,
			},
		}
		const s = rootStyle(figmaNodeToHtml(node).html)
		expect(s).toContain('font-style:italic')
		expect(s).toContain('text-transform:uppercase')
		expect(s).toContain('text-decoration:underline')
		expect(s).toContain('letter-spacing:2px')
		expect(s).toContain('line-height:24px')
		expect(s).toContain('white-space:pre-wrap')
	})
})

describe('figmaNodeToHtml — 박스 속성', () => {
	const boxNode = (extra: Record<string, unknown>) => ({
		id: '1:1',
		name: 'box',
		type: 'FRAME',
		absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
		...extra,
	})

	it('stroke를 border로, cornerRadius를 border-radius로', () => {
		const s = rootStyle(
			figmaNodeToHtml(
				boxNode({
					strokes: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
					strokeWeight: 3,
					cornerRadius: 8,
				}),
			).html,
		)
		expect(s).toContain('border:3px solid rgb(255,0,0)')
		expect(s).toContain('border-radius:8px')
	})

	it('개별 corner/stroke 두께', () => {
		const s = rootStyle(
			figmaNodeToHtml(
				boxNode({
					rectangleCornerRadii: [1, 2, 3, 4],
					strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
					individualStrokeWeights: { top: 1, right: 2, bottom: 3, left: 4 },
				}),
			).html,
		)
		expect(s).toContain('border-radius:1px 2px 3px 4px')
		expect(s).toContain('border-top-width:1px')
		expect(s).toContain('border-left-width:4px')
	})

	it('opacity·clipsContent·blendMode·effects를 옮긴다', () => {
		const s = rootStyle(
			figmaNodeToHtml(
				boxNode({
					opacity: 0.5,
					clipsContent: true,
					blendMode: 'MULTIPLY',
					effects: [
						{
							type: 'DROP_SHADOW',
							radius: 4,
							spread: 1,
							offset: { x: 2, y: 3 },
							color: { r: 0, g: 0, b: 0, a: 0.25 },
						},
						{ type: 'LAYER_BLUR', radius: 6 },
					],
				}),
			).html,
		)
		expect(s).toContain('opacity:0.5')
		expect(s).toContain('overflow:hidden')
		expect(s).toContain('mix-blend-mode:multiply')
		expect(s).toContain('box-shadow:2px 3px 4px 1px rgba(0,0,0,0.25)')
		expect(s).toContain('filter:blur(6px)')
	})

	it('linear-gradient 배경 (색 정지점 정확)', () => {
		const s = rootStyle(
			figmaNodeToHtml(
				boxNode({
					fills: [
						{
							type: 'GRADIENT_LINEAR',
							gradientHandlePositions: [
								{ x: 0, y: 0 },
								{ x: 0, y: 1 },
							],
							gradientStops: [
								{ color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
								{ color: { r: 0, g: 0, b: 1, a: 1 }, position: 1 },
							],
						},
					],
				}),
			).html,
		)
		expect(s).toContain('background:linear-gradient(180deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%)')
	})
})

describe('figmaNodeToHtml — flex', () => {
	it('WRAP·align-self·FIXED 치수', () => {
		const { html } = figmaNodeToHtml({
			id: '1:1',
			name: 'row',
			type: 'FRAME',
			layoutMode: 'HORIZONTAL',
			layoutWrap: 'WRAP',
			itemSpacing: 8,
			absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 100 },
			children: [
				{
					id: '1:2',
					name: 'child',
					type: 'FRAME',
					layoutAlign: 'STRETCH',
					layoutSizingHorizontal: 'FIXED',
					layoutSizingVertical: 'HUG',
					absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 40 },
				},
			],
		})
		expect(html).toContain('flex-wrap:wrap')
		expect(html).toContain('gap:8px')
		const child = html.match(/<div data-node-id="1:2"[^>]*style="([^"]*)"/)?.[1] ?? ''
		expect(child).toContain('align-self:stretch')
		expect(child).toContain('width:50px')
		expect(child).not.toContain('height:40px')
	})
})

describe('figmaNodeToHtml — 리뷰 수정 회귀', () => {
	const gridChild = (extra: Record<string, unknown>) => ({
		id: '1:1',
		name: 'g',
		type: 'FRAME',
		layoutMode: 'GRID',
		gridColumnsSizing: '1fr 1fr',
		gridRowsSizing: '1fr',
		absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 100 },
		children: [
			{
				id: '1:2',
				name: 'cell',
				type: 'RECTANGLE',
				absoluteBoundingBox: { x: 0, y: 0, width: 80, height: 60 },
				...extra,
			},
		],
	})
	const childStyle = (html: string) =>
		html.match(/<div data-node-id="1:2"[^>]*style="([^"]*)"/)?.[1] ?? ''

	it('그리드 FIXED 자식은 명시 치수 + start (0폭 붕괴 방지)', () => {
		const s = childStyle(
			figmaNodeToHtml(
				gridChild({ layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED' }),
			).html,
		)
		expect(s).toContain('width:80px')
		expect(s).toContain('height:60px')
		expect(s).toContain('justify-self:start')
	})

	it('그리드 FILL 자식(AUTO 정렬)은 stretch', () => {
		const s = childStyle(
			figmaNodeToHtml(
				gridChild({ layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'FILL' }),
			).html,
		)
		expect(s).toContain('justify-self:stretch')
		expect(s).toContain('align-self:stretch')
	})

	it('컨테이너는 position:relative(절대배치 자식 기준), 절대배치 자식은 absolute가 이긴다', () => {
		// 루트(레이아웃 없음) + 절대배치 자식
		const { html } = figmaNodeToHtml({
			id: '1:1',
			name: 'card',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
			children: [
				{
					id: '1:2',
					name: 't',
					type: 'TEXT',
					characters: 'hi',
					absoluteBoundingBox: { x: 20, y: 20, width: 100, height: 20 },
				},
			],
		})
		const root = html.match(/^<div [^>]*style="([^"]*)"/)?.[1] ?? ''
		expect(root).toContain('position:relative')
		const child = html.match(/<p data-node-id="1:2"[^>]*style="([^"]*)"/)?.[1] ?? ''
		expect(child).toContain('position:absolute')
		expect(child).toContain('left:20px')
	})

	it('gradient는 paint.opacity를 정지점 알파에 곱한다', () => {
		const s =
			figmaNodeToHtml({
				id: '1:1',
				name: 'g',
				type: 'FRAME',
				absoluteBoundingBox: { x: 0, y: 0, width: 10, height: 10 },
				fills: [
					{
						type: 'GRADIENT_LINEAR',
						opacity: 0.5,
						gradientHandlePositions: [
							{ x: 0, y: 0 },
							{ x: 0, y: 1 },
						],
						gradientStops: [
							{ color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
							{ color: { r: 0, g: 0, b: 1, a: 1 }, position: 1 },
						],
					},
				],
			}).html.match(/^<div [^>]*style="([^"]*)"/)?.[1] ?? ''
		expect(s).toContain('rgba(255,0,0,0.5)')
		expect(s).toContain('rgba(0,0,255,0.5)')
	})

	it('node.id의 큰따옴표를 이스케이프해 속성 탈출/핸들러 주입을 막는다', () => {
		const { html } = figmaNodeToHtml({
			id: '1:2" onmouseover="x',
			name: 'n',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 10, height: 10 },
		})
		expect(html).not.toContain('onmouseover="x"')
		expect(html).toContain('data-node-id="1:2&quot; onmouseover=&quot;x"')
	})
})
