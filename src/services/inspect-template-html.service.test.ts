import { describe, expect, it } from 'vitest'
import { convertFigmaNodeToHtml } from '@/features/template-import/utils/figma-node-to-html'
import { composeTemplateHtml } from './compose-template-html.client'
import { inspectDraftTemplateHtml, inspectTemplateHtml } from './inspect-template-html.service'
import { parseTemplateNodeConfigs } from './parse-template-node-configs.service'

function parsedConfigs(value: unknown) {
	const parsed = parseTemplateNodeConfigs(value)
	if ('blocker' in parsed) throw new Error(parsed.blocker)
	return parsed
}

describe('template HTML inspection', () => {
	it('실행 속성과 외부 URL을 draft에서 거부한다', () => {
		const result = inspectDraftTemplateHtml({
			html: '<img data-node-id="logo" src="https://attacker.example/x" onerror="alert(1)">',
			overrideNodeIds: [],
			refsByNode: new Map(),
		})

		expect(result.blocker).toContain('허용하지 않는 속성')
	})

	it('실제 Figma 변환 구조를 허용한다', () => {
		const converted = convertFigmaNodeToHtml({
			id: 'I571:4018;450:1129',
			name: 'Instance',
			type: 'FRAME',
			layoutMode: 'HORIZONTAL',
			layoutWrap: 'WRAP',
			itemSpacing: 8,
			counterAxisSpacing: 12,
			counterAxisAlignItems: 'BASELINE',
			counterAxisAlignContent: 'SPACE_BETWEEN',
			absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 },
		} as never)

		expect(
			inspectDraftTemplateHtml({
				baseHtml: converted.html,
				html: converted.html,
				overrideNodeIds: [],
				refsByNode: new Map(),
			}).blocker,
		).toBeUndefined()
	})

	// 변환기(emit)의 출력 어휘와 저장 허용 목록의 드리프트를 잡는 대조 테스트 —
	// 새 lowering(배경 fill·다중 배경 레이어·회전 transform 합성)이 저장 검증을 통과해야 한다.
	it('lowering이 만드는 새 CSS 출력도 저장 검증을 통과한다', () => {
		const converted = convertFigmaNodeToHtml(
			{
				id: '1:1',
				name: 'hero',
				type: 'FRAME',
				fills: [{ type: 'IMAGE', imageRef: 'ref-1', scaleMode: 'FILL' }],
				absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 600 },
				children: [
					{
						id: '1:2',
						name: 'overlay',
						type: 'RECTANGLE',
						fills: [
							{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 0.4 } },
							{
								type: 'GRADIENT_LINEAR',
								gradientHandlePositions: [
									{ x: 0, y: 0 },
									{ x: 0, y: 1 },
								],
								gradientStops: [
									{ color: { r: 0, g: 0, b: 0, a: 0.5 }, position: 0 },
									{ color: { r: 0, g: 0, b: 0, a: 0 }, position: 1 },
								],
							},
						],
						rotation: 10,
						constraints: { horizontal: 'CENTER', vertical: 'CENTER' },
						absoluteBoundingBox: { x: 100, y: 100, width: 200, height: 100 },
						size: { x: 180, y: 80 },
					},
				],
			} as never,
			{},
			{
				'ref-1': {
					collection: 'application-images',
					id: 31,
					url: '/api/application-images/file/hero-fill.png',
				},
			},
		)

		expect(converted.html).toContain('background-image:url(')
		expect(converted.html).toContain('transform:')
		expect(
			inspectDraftTemplateHtml({
				baseHtml: converted.html,
				html: converted.html,
				overrideNodeIds: [],
				refsByNode: new Map(),
			}).blocker,
		).toBeUndefined()
	})

	it('캐리어 마커가 있는 import·합성 HTML이 발행 검사를 통과한다', () => {
		// clipsContent 프레임 + 유일한 IMAGE fill 자식 → 자식이 data-image-carrier로 방출된다.
		const converted = convertFigmaNodeToHtml(
			{
				id: '2:1',
				name: 'Image Area',
				type: 'FRAME',
				clipsContent: true,
				absoluteBoundingBox: { x: 0, y: 0, width: 911, height: 492 },
				children: [
					{
						id: '2:2',
						name: 'placeholder',
						type: 'RECTANGLE',
						fills: [{ type: 'IMAGE', imageRef: 'ref-1', scaleMode: 'FILL' }],
						absoluteBoundingBox: { x: 0, y: -38, width: 1036, height: 578 },
					},
				],
			} as never,
			{},
			{
				'ref-1': {
					collection: 'application-images',
					id: 3,
					url: '/api/application-images/file/ph.png',
				},
			},
		)
		const parsed = parsedConfigs({
			'2:1': { backgroundImage: '/api/generated-images/file/gen.png', generatedImageId: 9 },
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(converted.html).toContain('data-image-carrier')
		expect(composed).toContain('data-image-carrier')
		expect(
			inspectTemplateHtml({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}).blocker,
		).toBeUndefined()
	})

	it('imageTransform이 적용된 합성 HTML도 발행 검사를 통과한다', () => {
		// transform은 저장 허용 목록에 이미 있다(inspect-template-style) — 여기서 회귀를 고정한다.
		const converted = convertFigmaNodeToHtml(
			{
				id: '2:1',
				name: 'Image Area',
				type: 'FRAME',
				clipsContent: true,
				absoluteBoundingBox: { x: 0, y: 0, width: 911, height: 492 },
				children: [
					{
						id: '2:2',
						name: 'placeholder',
						type: 'RECTANGLE',
						fills: [{ type: 'IMAGE', imageRef: 'ref-1', scaleMode: 'FILL' }],
						absoluteBoundingBox: { x: 0, y: -38, width: 1036, height: 578 },
					},
				],
			} as never,
			{},
			{
				'ref-1': {
					collection: 'application-images',
					id: 3,
					url: '/api/application-images/file/ph.png',
				},
			},
		)
		const parsed = parsedConfigs({
			'2:1': {
				backgroundImage: '/api/generated-images/file/gen.png',
				generatedImageId: 9,
				imageTransform: { x: 40, y: -20, scale: 1.3, rotate: 12 },
			},
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(composed).toContain('transform:')
		expect(
			inspectTemplateHtml({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}).blocker,
		).toBeUndefined()
	})

	it('공개 HTML의 staging URL을 거부한다', () => {
		const html = '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">'
		const result = inspectTemplateHtml({
			baseHtml: html,
			html,
			overrideNodeIds: [],
			refsByNode: new Map(),
		})

		expect(result.blocker).toContain('모든 URL은 인가 에셋')
	})

	it('공개 HTML과 override의 구조화 참조가 같아야 한다', () => {
		const url = '/api/brand-logos/file/official.svg'
		const parsed = parsedConfigs({
			logo: { vectorAsset: { collection: 'brand-logos', id: 8, src: url } },
		})
		const baseHtml = '<div data-node-id="logo"></div>'
		const html = `<img data-node-id="logo" data-asset-collection="brand-logos" data-asset-id="8" src="${url}" alt="">`

		expect(
			inspectTemplateHtml({
				baseHtml,
				html,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}).blocker,
		).toBeUndefined()
	})

	it('존재하지 않는 노드의 override를 거부한다', () => {
		const parsed = parsedConfigs({ missing: { text: 'x' } })
		const result = inspectDraftTemplateHtml({
			html: '<div data-node-id="frame"></div>',
			overrideNodeIds: Object.keys(parsed.data),
			refsByNode: parsed.refsByNode,
		})

		expect(result.blocker).toContain('존재하지 않는 노드')
	})

	it('slash로 구분한 이벤트 속성도 거부한다', () => {
		const result = inspectDraftTemplateHtml({
			html: '<img data-node-id="logo"/src="x"/onerror="alert(1)">',
			overrideNodeIds: [],
			refsByNode: new Map(),
		})

		expect(result.blocker).toContain('허용하지 않는 속성')
	})

	it('baseHtml의 내부 에셋 background-image는 허용하고 외부 URL은 거부한다', () => {
		const internal =
			'<div data-node-id="hero" data-asset-collection="application-images" data-asset-id="11"' +
			' style="background-image:url(/api/application-images/file/fill.png);background-size:cover;"></div>'
		expect(
			inspectDraftTemplateHtml({
				baseHtml: internal,
				overrideNodeIds: [],
				refsByNode: new Map(),
			}).blocker,
		).toBeUndefined()

		const external =
			'<div data-node-id="hero" style="background-image:url(https://attacker.example/x.png);"></div>'
		expect(
			inspectDraftTemplateHtml({
				baseHtml: external,
				overrideNodeIds: [],
				refsByNode: new Map(),
			}).blocker,
		).toContain('baseHtml에는 내부 staging 에셋')
	})
})
