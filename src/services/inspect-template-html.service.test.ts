import { describe, expect, it } from 'vitest'
import { convertFigmaNodeToHtml } from '@/features/template-import/utils/figma-node-to-html'
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
})
