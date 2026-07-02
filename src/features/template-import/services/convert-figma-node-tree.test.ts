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
				type: 'RECTANGLE',
				absoluteBoundingBox: { x: 100, y: 900, width: 1080, height: 450 },
				fills: [{ type: 'IMAGE' }],
				cornerRadius: 16,
			},
			{
				id: '1:4',
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
	it('IMAGE fill 노드와 벡터 계열 노드만 모으고 숨김 노드는 건너뛴다', () => {
		expect(collectRenderableNodeIds(buildFixture())).toEqual(['1:3', '1:4'])
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
			slotLabel: '여기에 문구를 입력하세요 — 메인 카',
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
				slotLabel: '이미지 1',
			},
			{
				assetId: 12,
				src: '/api/template-assets/file/icon.png',
				borderRadius: 0,
				locked: false,
				slotLabel: '이미지 2',
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

	it('zIndex는 순회 순서를 따른다', () => {
		const template = convertFigmaNodeTree(buildFixture(), assets)

		expect(template.elements.map((element) => element.zIndex)).toEqual([1, 2, 3, 4, 5, 6])
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
})
