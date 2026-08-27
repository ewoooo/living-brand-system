// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { solidColor, templateDomToVectorScene } from './template-dom-to-vector-scene.client'

/** jsdom은 레이아웃을 하지 않는다 — 워커가 읽는 상자만 심어 준다. */
function measure(element: Element, box: { x: number; y: number; width: number; height: number }) {
	element.getBoundingClientRect = () =>
		({
			left: box.x,
			top: box.y,
			right: box.x + box.width,
			bottom: box.y + box.height,
			width: box.width,
			height: box.height,
			x: box.x,
			y: box.y,
			toJSON: () => ({}),
		}) as DOMRect
}

function stageWith(html: string): HTMLElement {
	const stage = document.createElement('div')
	stage.innerHTML = html
	document.body.replaceChildren(stage)
	measure(stage, { x: 0, y: 0, width: 400, height: 300 })
	return stage
}

describe('templateDomToVectorScene', () => {
	beforeEach(() => document.body.replaceChildren())

	it('div 배경과 테두리를 판 좌표계의 rect로 옮긴다', () => {
		const stage = stageWith(
			'<div data-node-id="frame-1" data-name="Card" style="background-color:#eeeeee;border:2px solid #112233;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom-right-radius:8px;border-bottom-left-radius:8px"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 10, y: 20, width: 100, height: 50 })

		const { scene } = templateDomToVectorScene(stage, { width: 400, height: 300 })

		expect(scene.primitives).toEqual([
			{
				kind: 'group',
				label: 'Card',
				children: [
					{
						kind: 'rect',
						x: 10,
						y: 20,
						width: 100,
						height: 50,
						fill: '#eeeeee',
						stroke: '#112233',
						strokeWidth: 2,
						radius: 8,
					},
				],
			},
		])
	})

	it('내용이 없는 노드는 버린다 — 빈 그룹이 남으면 받는 쪽 레이어가 지저분해진다', () => {
		const stage = stageWith('<div data-node-id="empty-1"></div>')
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 10, height: 10 })

		expect(
			templateDomToVectorScene(stage, { width: 400, height: 300 }).scene.primitives,
		).toEqual([])
	})

	it('img를 image 프리미티브로 옮기고 object-fit을 preserveAspectRatio로 번역한다', () => {
		const stage = stageWith(
			'<img data-node-id="img-1" src="data:image/png;base64,AAA" style="object-fit:contain">',
		)
		measure(stage.firstElementChild as Element, { x: 5, y: 5, width: 40, height: 40 })

		const { scene } = templateDomToVectorScene(stage, { width: 400, height: 300 })
		const group = scene.primitives[0]

		expect(group.kind === 'group' && group.children[0]).toMatchObject({
			kind: 'image',
			href: 'data:image/png;base64,AAA',
			preserveAspectRatio: 'xMidYMid meet',
			x: 5,
			y: 5,
		})
	})

	it('벡터로 못 옮기는 효과는 버리지 않고 unsupported로 보고한다', () => {
		const stage = stageWith(
			'<div data-node-id="hero" style="background-image:linear-gradient(90deg,#000,#fff);box-shadow:0 2px 4px #000"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 100, height: 100 })

		const { unsupported } = templateDomToVectorScene(stage, { width: 400, height: 300 })

		expect(unsupported).toContainEqual({ nodeId: 'hero', reason: 'gradient' })
		expect(unsupported).toContainEqual({ nodeId: 'hero', reason: 'box-shadow' })
	})

	it('숨긴 노드는 훑지 않는다', () => {
		const stage = stageWith(
			'<div data-node-id="hidden" style="display:none;background-color:#ff0000"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 10, height: 10 })

		expect(
			templateDomToVectorScene(stage, { width: 400, height: 300 }).scene.primitives,
		).toEqual([])
	})
})

describe('solidColor', () => {
	it('투명은 색이 아니다 — rgba(0,0,0,0)을 검정으로 읽으면 배경 없는 판이 검게 인쇄된다', () => {
		expect(solidColor('rgba(0, 0, 0, 0)')).toBeNull()
		expect(solidColor('rgb(17, 34, 51)')).toBe('#112233')
		expect(solidColor('rgba(255, 0, 0, 0.5)')).toBe('#ff0000')
		expect(solidColor('#abcdef')).toBe('#abcdef')
	})
})
