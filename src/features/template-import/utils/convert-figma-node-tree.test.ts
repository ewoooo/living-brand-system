import { describe, expect, it } from 'vitest'
import { jsonTemplateSchema } from '@/types/json-template'
import type { FigmaNode } from '../repositories/figma.rest.repository'
import { collectRenderableNodeIds, convertFigmaNodeTree } from './convert-figma-node-tree'
import { parseFigmaUrl } from './parse-figma-url'

const ROOT_BOX = { x: 100, y: 200, width: 1080, height: 1350 }

function buildFixture(): FigmaNode {
	return {
		id: '1:1',
		type: 'FRAME',
		absoluteBoundingBox: ROOT_BOX,
		fills: [{ type: 'SOLID', color: { r: 0.058_823, g: 0.090_196, b: 0.164_705 } }],
		children: [
			{
				id: '1:2',
				name: 'Main Copy',
				type: 'TEXT',
				absoluteBoundingBox: { x: 150, y: 300, width: 500, height: 60 },
				characters: '여기에 문구를 입력하세요 — 메인 카피 자리입니다',
				fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
				style: {
					fontFamily: 'Pretendard',
					fontSize: 48,
					fontWeight: 700,
					lineHeightPx: 62.4,
					textAlignHorizontal: 'CENTER',
				},
			},
			{
				id: '1:3',
				name: 'Hero Photo',
				type: 'RECTANGLE',
				absoluteBoundingBox: { x: 100, y: 900, width: 1080, height: 450 },
				fills: [{ type: 'IMAGE' }],
				cornerRadius: 16,
			},
			{
				id: '1:4',
				name: 'Brand Icon',
				type: 'VECTOR',
				absoluteBoundingBox: { x: 120, y: 220, width: 40, height: 40 },
			},
			{
				id: '1:5',
				type: 'RECTANGLE',
				absoluteBoundingBox: { x: 100, y: 200, width: 1080, height: 200 },
				fills: [
					{
						type: 'GRADIENT_LINEAR',
						gradientStops: [
							{ color: { r: 1, g: 0, b: 0 }, position: 0 },
							{ color: { r: 0, g: 0, b: 1 }, position: 1 },
						],
						gradientHandlePositions: [
							{ x: 0, y: 0 },
							{ x: 0, y: 1 },
						],
					},
				],
			},
			{
				id: '1:6',
				type: 'FRAME',
				absoluteBoundingBox: { x: 200, y: 500, width: 400, height: 300 },
				fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.5 }],
				children: [
					{
						id: '1:7',
						type: 'TEXT',
						absoluteBoundingBox: { x: 220, y: 520, width: 200, height: 30 },
						characters: '서브 카피',
						fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
					},
				],
			},
			{
				id: '1:8',
				type: 'TEXT',
				visible: false,
				absoluteBoundingBox: { x: 0, y: 0, width: 10, height: 10 },
				characters: '숨김 텍스트',
			},
		],
	}
}

describe('collectRenderableNodeIds', () => {
	it('IMAGE fill과 벡터 계열 노드를 포맷별로 모으고 숨김 노드는 건너뛴다', () => {
		expect(collectRenderableNodeIds(buildFixture())).toEqual({
			imageFillNodeIds: ['1:3'],
			vectorNodeIds: ['1:4'],
		})
	})
})

describe('convertFigmaNodeTree', () => {
	const assets = {
		'1:3': { assetId: 11, src: '/api/template-assets/file/photo.png' },
		'1:4': { assetId: 12, src: '/api/template-assets/file/icon.png' },
	}

	it('프레임 크기·배경·요소를 zod 계약에 맞게 변환한다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)

		expect(() => jsonTemplateSchema.parse(template)).not.toThrow()
		expect(template.width).toBe(1080)
		expect(template.height).toBe(1350)
		expect(template.background).toBe('#0f172a')
		expect(template.elements).toHaveLength(6)
	})

	it('텍스트는 슬롯으로 열고 스타일을 CSS 값으로 바꾼다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)
		const text = template.elements[0]

		expect(text).toMatchObject({
			type: 'text',
			x: 50,
			y: 100,
			width: 500,
			height: 60,
			fontSize: 48,
			fontWeight: '700',
			color: '#ffffff',
			textAlign: 'center',
			locked: false,
			slotLabel: 'Main Copy',
		})

		if (text.type !== 'text') throw new Error('unreachable')
		expect(text.lineHeight).toBeCloseTo(1.3)
	})

	it('IMAGE fill과 벡터 노드는 영속화된 에셋을 참조하는 이미지 슬롯이 된다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)
		const images = template.elements.filter((element) => element.type === 'image')

		expect(images).toMatchObject([
			{
				assetId: 11,
				src: '/api/template-assets/file/photo.png',
				borderRadius: 16,
				locked: false,
				slotLabel: 'Hero Photo',
			},
			{
				assetId: 12,
				src: '/api/template-assets/file/icon.png',
				borderRadius: 0,
				locked: false,
				slotLabel: 'Brand Icon',
			},
		])
	})

	it('에셋이 없는 이미지 노드는 요소를 만들지 않는다', () => {
		const template = convertFigmaNodeTree(buildFixture(), {})

		expect(template.elements.filter((element) => element.type === 'image')).toHaveLength(0)
	})

	it('그라디언트 fill은 CSS gradient 문자열의 잠긴 rect가 된다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)
		const gradient = template.elements.find(
			(element) => element.type === 'rect' && element.fill.startsWith('linear-gradient'),
		)

		expect(gradient).toMatchObject({
			fill: 'linear-gradient(180deg, #ff0000 0%, #0000ff 100%)',
			locked: true,
		})
	})

	it('컨테이너 프레임은 rect를 만들고 내부 텍스트도 계속 탐색한다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)
		const nestedText = template.elements.find(
			(element) => element.type === 'text' && element.text === '서브 카피',
		)
		const frameRect = template.elements.find(
			(element) => element.type === 'rect' && element.fill.startsWith('rgba'),
		)

		expect(nestedText).toMatchObject({ x: 120, y: 320 })
		expect(frameRect).toMatchObject({ fill: 'rgba(255,255,255,0.50)' })
	})

	it('textAutoResize TRUNCATE는 말줄임 textFit으로 승계한다', () => {
		const fixture: FigmaNode = {
			id: '5:1',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 200 },
			children: [
				{
					id: '5:2',
					type: 'TEXT',
					absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 60 },
					characters: '말줄임 텍스트',
					style: { fontSize: 24, textAutoResize: 'TRUNCATE' },
				},
			],
		}
		const template = convertFigmaNodeTree(fixture, {})

		expect(template.elements[0]).toMatchObject({ type: 'text', textFit: 'truncate' })
	})

	it('zIndex는 순회 순서를 따른다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)

		expect(template.elements.map((element) => element.zIndex)).toEqual([1, 2, 3, 4, 5, 6])
	})
})

describe('convertFigmaNodeTree (stack 승격)', () => {
	/** Living Design System 예시(node 110-54) 축약: 루트 세로 스택 > 가로 space-between 행 > 로고+텍스트. */
	function buildAutoLayoutFixture(): FigmaNode {
		return {
			id: '2:1',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 1115, height: 1000 },
			fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
			layoutMode: 'VERTICAL',
			primaryAxisAlignItems: 'MAX',
			counterAxisAlignItems: 'CENTER',
			paddingTop: 50,
			paddingRight: 50,
			paddingBottom: 50,
			paddingLeft: 50,
			itemSpacing: 10,
			children: [
				{
					id: '2:2',
					type: 'FRAME',
					absoluteBoundingBox: { x: 50, y: 236, width: 1015, height: 714 },
					layoutMode: 'HORIZONTAL',
					primaryAxisAlignItems: 'SPACE_BETWEEN',
					itemSpacing: 99,
					layoutSizingHorizontal: 'FILL',
					children: [
						{
							id: '2:3',
							type: 'VECTOR',
							absoluteBoundingBox: { x: 100, y: 286, width: 238, height: 141 },
						},
						{
							id: '2:4',
							type: 'TEXT',
							absoluteBoundingBox: { x: 700, y: 286, width: 279, height: 61 },
							characters: 'Placeholder',
							fills: [{ type: 'SOLID', color: { r: 0.917, g: 0.325, b: 0.262 } }],
							style: { fontSize: 50, textAutoResize: 'WIDTH_AND_HEIGHT' },
							layoutSizingHorizontal: 'HUG',
						},
					],
				},
			],
		}
	}

	const stackAssets = { '2:3': { assetId: 21, src: '/api/template-assets/file/logo.svg' } }

	it('루트 auto-layout은 캔버스 크기의 단일 스택으로 승격된다', () => {
		const template = convertFigmaNodeTree(buildAutoLayoutFixture(), stackAssets)

		expect(() => jsonTemplateSchema.parse(template)).not.toThrow()
		expect(template.elements).toHaveLength(1)
		expect(template.elements[0]).toMatchObject({
			type: 'stack',
			x: 0,
			y: 0,
			width: 1115,
			height: 1000,
			direction: 'vertical',
			justify: 'end',
			align: 'center',
			gap: 10,
			padding: { top: 50, right: 50, bottom: 50, left: 50 },
			// 원본 프레임 배경 보존 — 평탄화 경로의 rect와 동일한 역할.
			fill: '#ffffff',
			locked: true,
		})
	})

	it('중첩 스택은 크기 모드를 승계하고 space-between은 gap을 버린다', () => {
		const template = convertFigmaNodeTree(buildAutoLayoutFixture(), stackAssets)
		const root = template.elements[0]

		if (root?.type !== 'stack') throw new Error('unreachable')
		const row = root.children[0]

		if (row?.type !== 'stack') throw new Error('unreachable')
		expect(row).toMatchObject({
			direction: 'horizontal',
			justify: 'space-between',
			gap: 0,
			widthMode: 'fill',
		})
		expect(row.children).toMatchObject([
			{ type: 'image', assetId: 21, widthMode: 'fixed', locked: false },
			{
				type: 'text',
				text: 'Placeholder',
				widthMode: 'hug',
				textFit: 'auto-width',
				locked: false,
			},
		])
	})

	it('슬롯이 없는 auto-layout 프레임은 기존처럼 평탄화된다', () => {
		const fixture: FigmaNode = {
			id: '3:1',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
			layoutMode: 'VERTICAL',
			children: [
				{
					id: '3:2',
					type: 'RECTANGLE',
					absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 },
					fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
				},
			],
		}
		const template = convertFigmaNodeTree(fixture, {})

		expect(template.elements).toMatchObject([{ type: 'rect' }])
	})

	it('auto-layout이 아닌 컨테이너가 섞이면 승격하지 않고 평탄화한다', () => {
		const fixture: FigmaNode = {
			id: '4:1',
			type: 'FRAME',
			absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 200 },
			layoutMode: 'VERTICAL',
			children: [
				{
					id: '4:2',
					type: 'FRAME',
					absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 100 },
					children: [
						{
							id: '4:3',
							type: 'TEXT',
							absoluteBoundingBox: { x: 10, y: 10, width: 100, height: 20 },
							characters: '텍스트',
						},
					],
				},
			],
		}
		const template = convertFigmaNodeTree(fixture, {})

		expect(template.elements.some((element) => element.type === 'stack')).toBe(false)
		expect(template.elements.find((element) => element.type === 'text')).toMatchObject({
			x: 10,
			y: 10,
		})
	})
})

describe('parseFigmaUrl', () => {
	it('design URL에서 fileKey와 API 형식 nodeId를 뽑는다', () => {
		expect(
			parseFigmaUrl('https://www.figma.com/design/AbC123xyz/배너-시안?node-id=12-345&t=abc'),
		).toEqual({ fileKey: 'AbC123xyz', nodeId: '12:345' })
	})

	it('구형 file URL도 지원한다', () => {
		expect(parseFigmaUrl('https://www.figma.com/file/AbC123xyz/name?node-id=1-2')).toEqual({
			fileKey: 'AbC123xyz',
			nodeId: '1:2',
		})
	})

	it('figma.com이 아니거나 node-id가 없으면 null', () => {
		expect(parseFigmaUrl('https://example.com/design/AbC123?node-id=1-2')).toBeNull()
		expect(parseFigmaUrl('https://www.figma.com/design/AbC123xyz/name')).toBeNull()
		expect(parseFigmaUrl('not a url')).toBeNull()
	})

	it('figma.com으로 끝나기만 하는 유사 도메인은 거부한다', () => {
		expect(parseFigmaUrl('https://evilfigma.com/design/AbC123xyz/name?node-id=1-2')).toBeNull()
		expect(parseFigmaUrl('https://figma.com/design/AbC123xyz/name?node-id=1-2')).not.toBeNull()
	})
})
