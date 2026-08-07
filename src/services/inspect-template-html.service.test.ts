import { describe, expect, it } from 'vitest'
import { convertFigmaNodeToHtml } from '@/features/template-import/utils/figma-node-to-html'
import { composeTemplateHtml } from './compose-template-html.client'
import {
	findMissingOverrideNodeBlocker,
	inspectTemplateFragment,
} from './inspect-template-html.service'
import { parseTemplateNodeConfigs } from './parse-template-node-configs.service'
import type { AuthorizedTemplateImageRef } from './template-asset-policy.service'

function parsedConfigs(value: unknown) {
	const parsed = parseTemplateNodeConfigs(value)
	if ('blocker' in parsed) throw new Error(parsed.blocker)
	return parsed
}

// draft 저장 검사와 같은 조합: base fragment → draft fragment → override 노드 존재.
function draftBlocker(input: {
	baseHtml?: string
	html?: string
	overrideNodeIds?: readonly string[]
}) {
	const base = input.baseHtml ? inspectTemplateFragment(input.baseHtml, 'base') : undefined
	if (base?.blocker) return base.blocker
	const draft = input.html ? inspectTemplateFragment(input.html, 'draft') : undefined
	if (draft?.blocker) return draft.blocker
	const nodeIds = draft?.nodeIds ?? base?.nodeIds ?? new Set<string>()
	return findMissingOverrideNodeBlocker(input.overrideNodeIds ?? [], [nodeIds]) ?? undefined
}

// 발행 검사와 같은 조합: base fragment → public fragment → override 노드 존재(양쪽 모두).
function publishBlocker(input: {
	baseHtml: string
	html: string
	overrideNodeIds: readonly string[]
	refsByNode: ReadonlyMap<string, AuthorizedTemplateImageRef>
}) {
	const base = inspectTemplateFragment(input.baseHtml, 'base')
	if (base.blocker) return base.blocker
	const published = inspectTemplateFragment(input.html, 'public', input.refsByNode)
	if (published.blocker) return published.blocker
	return (
		findMissingOverrideNodeBlocker(input.overrideNodeIds, [base.nodeIds, published.nodeIds]) ??
		undefined
	)
}

describe('template HTML inspection', () => {
	it('실행 속성과 외부 URL을 draft에서 거부한다', () => {
		const result = draftBlocker({
			html: '<img data-node-id="logo" src="https://attacker.example/x" onerror="alert(1)">',
		})

		expect(result).toContain('허용하지 않는 속성')
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

		expect(draftBlocker({ baseHtml: converted.html, html: converted.html })).toBeUndefined()
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
		expect(draftBlocker({ baseHtml: converted.html, html: converted.html })).toBeUndefined()
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
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('캐리어 사각형을 직접 선택해 설정해도 발행 검사를 통과한다', () => {
		// 회귀: override가 프레임이 아니라 캐리어 자신에 키됐을 때(#185로 열린 경로) compose가
		// 자신-캐리어를 놓치면 placeholder 참조가 남아 "HTML과 overrides의 에셋 참조 불일치"로 발행이 막혔다.
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
			'2:2': { backgroundImage: '/api/generated-images/file/gen.png', generatedImageId: 9 },
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('캐리어 아닌 래스터 img에 이미지를 할당해도 발행 검사를 통과한다', () => {
		// 회귀: 예전 compose는 래스터 img에 background-image를 칠하고 src를 남겨
		// "HTML과 overrides의 에셋 참조 불일치"로 발행이 막혔다 — 지금은 src를 갈아끼운다.
		// 자식이 둘이라 캐리어 판정이 되지 않는 프레임 + 래스터 폴백(renderedAssets) 자식.
		const converted = convertFigmaNodeToHtml(
			{
				id: '3:1',
				name: 'Card',
				type: 'FRAME',
				clipsContent: true,
				absoluteBoundingBox: { x: 0, y: 0, width: 911, height: 492 },
				children: [
					{
						id: '3:2',
						name: 'baked',
						type: 'RECTANGLE',
						absoluteBoundingBox: { x: 0, y: 0, width: 911, height: 492 },
					},
					{
						id: '3:3',
						name: 'deco',
						type: 'RECTANGLE',
						fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
						absoluteBoundingBox: { x: 0, y: 0, width: 10, height: 10 },
					},
				],
			} as never,
			{
				'3:2': {
					collection: 'application-images',
					id: 5,
					url: '/api/application-images/file/baked.png',
				},
			},
		)
		const parsed = parsedConfigs({
			'3:2': { backgroundImage: '/api/generated-images/file/gen.png', generatedImageId: 9 },
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(converted.html).not.toContain('data-image-carrier')
		expect(composed).toContain('/api/generated-images/file/gen.png')
		expect(
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
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
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('imageColorize가 적용된 합성 HTML이 draft·발행 검사를 통과한다', () => {
		// 컬러 치환은 캐리어를 2겹(바닥=라인색 + 마스크 오버레이)으로 재구성하고 에셋 참조를
		// 마스크 URL을 가진 오버레이로 옮긴다 — metadataRef의 동일 요소 URL·참조 짝 규칙을 고정한다.
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
				imageColorize: { line: '#112233', background: '#aabbcc' },
				imageTransform: { x: 40, y: -20, scale: 1.3, rotate: 12 },
			},
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(composed).toContain('mask-mode: luminance')
		expect(
			draftBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
			}),
		).toBeUndefined()
		expect(
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('배경 생략(line만) imageColorize도 draft·발행 검사를 통과한다', () => {
		// background 생략 시 compose가 단일 레이어 반전 마스크(linear-gradient 기준층 +
		// mask-composite: subtract)로 선만 칠한다 — 검사 계약은 동일하다.
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
				imageColorize: { line: '#112233' },
			},
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(composed).toContain('mask-composite: subtract')
		expect(composed).toContain('linear-gradient')
		expect(
			draftBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
			}),
		).toBeUndefined()
		expect(
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('캐리어 사각형을 직접 선택한 imageColorize도 발행 검사를 통과한다', () => {
		// override가 캐리어 자신에 키된 경우(#193 경로): 캐리어는 참조 없이 expected로만 남고
		// 오버레이가 합성 node-id로 마스크 URL과 참조를 가진다.
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
			'2:2': {
				backgroundImage: '/api/generated-images/file/gen.png',
				generatedImageId: 9,
				imageColorize: { line: '#112233', background: '#aabbcc' },
			},
		})
		const composed = composeTemplateHtml(converted.html, parsed.data)

		expect(
			publishBlocker({
				baseHtml: converted.html,
				html: composed,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('공개 HTML의 staging URL을 거부한다', () => {
		const html = '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">'
		const result = publishBlocker({
			baseHtml: html,
			html,
			overrideNodeIds: [],
			refsByNode: new Map(),
		})

		expect(result).toContain('모든 URL은 인가 에셋')
	})

	it('공개 HTML과 override의 구조화 참조가 같아야 한다', () => {
		const url = '/api/brand-logos/file/official.svg'
		const parsed = parsedConfigs({
			logo: { vectorAsset: { collection: 'brand-logos', id: 8, src: url } },
		})
		const baseHtml = '<div data-node-id="logo"></div>'
		const html = `<img data-node-id="logo" data-asset-collection="brand-logos" data-asset-id="8" src="${url}" alt="">`

		expect(
			publishBlocker({
				baseHtml,
				html,
				overrideNodeIds: Object.keys(parsed.data),
				refsByNode: parsed.refsByNode,
			}),
		).toBeUndefined()
	})

	it('존재하지 않는 노드의 override를 거부한다', () => {
		const parsed = parsedConfigs({ missing: { text: 'x' } })
		const result = draftBlocker({
			html: '<div data-node-id="frame"></div>',
			overrideNodeIds: Object.keys(parsed.data),
		})

		expect(result).toContain('존재하지 않는 노드')
	})

	it('slash로 구분한 이벤트 속성도 거부한다', () => {
		const result = draftBlocker({
			html: '<img data-node-id="logo"/src="x"/onerror="alert(1)">',
		})

		expect(result).toContain('허용하지 않는 속성')
	})

	it('baseHtml의 내부 에셋 background-image는 허용하고 외부 URL은 거부한다', () => {
		const internal =
			'<div data-node-id="hero" data-asset-collection="application-images" data-asset-id="11"' +
			' style="background-image:url(/api/application-images/file/fill.png);background-size:cover;"></div>'
		expect(draftBlocker({ baseHtml: internal })).toBeUndefined()

		const external =
			'<div data-node-id="hero" style="background-image:url(https://attacker.example/x.png);"></div>'
		expect(draftBlocker({ baseHtml: external })).toContain('baseHtml에는 내부 staging 에셋')
	})
})
