// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fitRect } from './image-to-data-url.client'

// jsdom에는 canvas가 없어 실제 굽기를 돌릴 수 없다 — 워커가 굽기를 **부르는지**만 본다.
// 구운 결과가 맞는지는 순수 함수 `fitRect`와 브라우저 실측이 담당한다.
// html-to-image도 jsdom에서 못 돈다 — 굽기를 부르는지만 본다.
vi.mock('html-to-image', () => ({ toPng: vi.fn(async () => 'data:image/png;base64,FLAT') }))
vi.mock('./image-to-data-url.client', async (importOriginal) => ({
	...(await importOriginal<typeof import('./image-to-data-url.client')>()),
	toBakedImageDataUrl: vi.fn(async () => 'data:image/png;base64,BAKED'),
}))

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

	it('img를 구운 data URI로 싣는다 — URL을 그대로 두면 파일 밖에서 안 보인다', async () => {
		const stage = stageWith(
			'<img data-node-id="img-1" src="/api/application-images/file/a.png" style="object-fit:contain">',
		)
		measure(stage.firstElementChild as Element, { x: 5, y: 5, width: 40, height: 40 })

		const { scene } = await templateDomToVectorScene(stage, { width: 400, height: 300 })
		const group = scene.primitives[0]

		expect(group.kind === 'group' && group.children[0]).toMatchObject({
			kind: 'image',
			href: 'data:image/png;base64,BAKED',
			// 맞춤은 굽는 쪽이 이미 반영했다 — 여기서 또 맞추면 두 번 적용된다.
			preserveAspectRatio: 'none',
			x: 5,
			y: 5,
		})
	})

	// 🔴 Figma importer는 IMAGE fill을 img가 아니라 background-image로 내린다 — 이걸 놓쳐서
	//    실제 템플릿에서 사진이 통째로 빠졌다(2026-08-27).
	it('div의 background-image도 싣는다', async () => {
		const stage = stageWith(
			'<div data-node-id="photo" style="background-image:url(&quot;/api/application-images/file/b.png&quot;);background-size:cover"></div>',
		)
		measure(stage.firstElementChild as Element, { x: 0, y: 0, width: 100, height: 100 })

		const { scene } = await templateDomToVectorScene(stage, { width: 400, height: 300 })
		const group = scene.primitives[0]

		expect(group.kind === 'group' && group.children[0]).toMatchObject({
			kind: 'image',
			href: 'data:image/png;base64,BAKED',
		})
	})

	// 🔴 굽지 않으면 배경 이미지를 건너뛰고 배경색만 남아 **단색 사각형이 그림을 덮는다**.
	//    Technical Illustration의 색 입힘이 이 형태다(2026-08-27 실물 확인).
	it('래스터 마스크는 그 노드를 구워 이미지로 얹는다', async () => {
		const stage = stageWith(
			'<div data-node-id="carrier" style="background-color:#ffffff">' +
				'<div data-node-id="carrier-colorize" style="background-color:#000000;mask-image:url(&quot;/api/generated-images/file/a.jpg&quot;)"></div>' +
				'</div>',
		)
		const carrier = stage.firstElementChild as HTMLElement
		measure(carrier, { x: 0, y: 0, width: 100, height: 100 })
		measure(carrier.firstElementChild as Element, { x: 0, y: 0, width: 100, height: 100 })

		const { scene, unsupported } = await templateDomToVectorScene(stage, {
			width: 400,
			height: 300,
		})
		const group = scene.primitives[0]
		const children = group.kind === 'group' ? group.children : []

		// 바닥은 벡터로 남고 오버레이만 이미지가 된다 — 그래야 밑색이 비쳐 원본과 같아진다.
		expect(children[0]).toMatchObject({ kind: 'rect', fill: '#ffffff' })
		const overlay = children[1]
		expect(overlay.kind === 'group' && overlay.children[0]).toMatchObject({
			kind: 'image',
			href: 'data:image/png;base64,FLAT',
		})
		expect(unsupported).toContainEqual({ nodeId: 'carrier-colorize', reason: 'mask' })
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

describe('fitRect', () => {
	const natural = { width: 200, height: 100 }
	const target = { width: 100, height: 100 }

	it('cover는 상자를 덮고 남는 쪽이 가운데로 넘친다', () => {
		expect(fitRect(natural, target, 'cover')).toEqual({
			x: -50,
			y: 0,
			width: 200,
			height: 100,
		})
	})

	it('contain은 비율을 지키고 남는 축을 가운데로 민다', () => {
		expect(fitRect(natural, target, 'contain')).toEqual({ x: 0, y: 25, width: 100, height: 50 })
	})

	it('fill은 상자를 그대로 채운다', () => {
		expect(fitRect(natural, target, 'fill')).toEqual({ x: 0, y: 0, width: 100, height: 100 })
	})
})
