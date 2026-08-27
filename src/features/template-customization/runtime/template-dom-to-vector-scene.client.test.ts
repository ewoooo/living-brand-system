// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
	hasRealGradient,
	solidColor,
	templateDomToVectorScene,
	uniformGradientColor,
} from './template-dom-to-vector-scene.client'

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

	it('div 배경과 테두리를 판 좌표계의 rect로 옮긴다', async () => {
		const stage = stageWith(
			'<div data-node-id="frame-1" data-name="Card" style="background-color:#eeeeee;border:2px solid #112233;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom-right-radius:8px;border-bottom-left-radius:8px"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 10, y: 20, width: 100, height: 50 })

		const { scene } = await templateDomToVectorScene(stage, { width: 400, height: 300 })

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

	it('내용이 없는 노드는 버린다 — 빈 그룹이 남으면 받는 쪽 레이어가 지저분해진다', async () => {
		const stage = stageWith('<div data-node-id="empty-1"></div>')
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 10, height: 10 })

		expect(
			(await templateDomToVectorScene(stage, { width: 400, height: 300 })).scene.primitives,
		).toEqual([])
	})

	it('img를 image 프리미티브로 옮기고 object-fit을 preserveAspectRatio로 번역한다', async () => {
		const stage = stageWith(
			'<img data-node-id="img-1" src="data:image/png;base64,AAA" style="object-fit:contain">',
		)
		measure(stage.firstElementChild as Element, { x: 5, y: 5, width: 40, height: 40 })

		const { scene } = await templateDomToVectorScene(stage, { width: 400, height: 300 })
		const group = scene.primitives[0]

		expect(group.kind === 'group' && group.children[0]).toMatchObject({
			kind: 'image',
			href: 'data:image/png;base64,AAA',
			preserveAspectRatio: 'xMidYMid meet',
			x: 5,
			y: 5,
		})
	})

	it('벡터로 못 옮기는 효과는 버리지 않고 unsupported로 보고한다', async () => {
		const stage = stageWith(
			'<div data-node-id="hero" style="background-image:linear-gradient(90deg,#000,#fff);box-shadow:0 2px 4px #000"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 100, height: 100 })

		const { unsupported } = await templateDomToVectorScene(stage, { width: 400, height: 300 })

		expect(unsupported).toContainEqual({ nodeId: 'hero', reason: 'gradient' })
		expect(unsupported).toContainEqual({ nodeId: 'hero', reason: 'box-shadow' })
	})

	it('숨긴 노드는 훑지 않는다', async () => {
		const stage = stageWith(
			'<div data-node-id="hidden" style="display:none;background-color:#ff0000"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 10, height: 10 })

		expect(
			(await templateDomToVectorScene(stage, { width: 400, height: 300 })).scene.primitives,
		).toEqual([])
	})
})

describe('solidColor', () => {
	it('투명은 색이 아니다 — rgba(0,0,0,0)을 검정으로 읽으면 배경 없는 판이 검게 인쇄된다', async () => {
		expect(solidColor('rgba(0, 0, 0, 0)')).toBeNull()
		expect(solidColor('rgb(17, 34, 51)')).toBe('#112233')
		expect(solidColor('rgba(255, 0, 0, 0.5)')).toBe('#ff0000')
		expect(solidColor('#abcdef')).toBe('#abcdef')
	})
})

describe('위장 그라디언트', () => {
	// 🔴 Figma importer가 배경 레이어 여러 겹일 때 SOLID를 linear-gradient(색,색)으로 바꿔 넣는다.
	//    그걸 진짜 그라디언트로 세면 멀쩡한 단색 배경이 전부 래스터 폴백으로 빠진다.
	it('정지점이 같은 색이면 단색으로 읽는다', () => {
		expect(uniformGradientColor('linear-gradient(rgb(0, 173, 69),rgb(0, 173, 69))')).toBe(
			'#00ad45',
		)
		expect(hasRealGradient('linear-gradient(rgb(0, 173, 69),rgb(0, 173, 69))')).toBe(false)
	})

	it('정지점이 다르면 진짜 그라디언트다', () => {
		expect(uniformGradientColor('linear-gradient(90deg,#000000,#ffffff)')).toBeNull()
		expect(hasRealGradient('linear-gradient(90deg,#000000,#ffffff)')).toBe(true)
	})

	it('배경이 없으면 그라디언트도 없다', () => {
		expect(hasRealGradient('none')).toBe(false)
	})

	it('단색 위장 레이어를 배경색보다 우선해 칠한다', async () => {
		const stage = stageWith(
			'<div data-node-id="layered" style="background-image:linear-gradient(rgb(0, 173, 69),rgb(0, 173, 69))"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 40, height: 40 })

		const { scene, unsupported } = await templateDomToVectorScene(stage, {
			width: 400,
			height: 300,
		})
		const group = scene.primitives[0]

		expect(group.kind === 'group' && group.children[0]).toMatchObject({
			kind: 'rect',
			fill: '#00ad45',
		})
		expect(unsupported).toEqual([])
	})
})
