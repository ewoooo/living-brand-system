import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { collectGuidelineCheckSources } from '../../checks/collect-guideline-check-sources'
import { buildCheckSourceSnapshot } from './build-check-source-snapshot'

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

describe('buildCheckSourceSnapshot', () => {
	it('blockId가 있으면 해당 block의 텍스트와 이미지 ID만 반환한다', () => {
		const page = {
			title: 'Logo',
			blocks: [
				{
					id: 'target',
					blockType: 'contentColumns',
					columns: [{ heading: 'Digital', body: lexical('Use 24 px.'), image: 7 }],
				},
				{ id: 'other', blockType: 'callout', kind: 'must', items: [] },
			],
		} as unknown as GuidelineDocument

		expect(buildCheckSourceSnapshot(page, 'target')).toEqual({
			evidence: {
				type: 'contentColumns',
				columns: [{ heading: 'Digital', body: 'Use 24 px.' }],
			},
			referenceAssets: [{ id: 7, role: 'context' }],
		})
	})

	it('Page 전체 snapshot은 설명과 모든 block을 합치고 이미지 ID를 중복 제거한다', () => {
		const page = {
			title: 'Logo usage',
			description: lexical('Approved applications'),
			blocks: [
				{ id: 'one', blockType: 'contentColumns', columns: [{ image: 8 }] },
				{
					id: 'two',
					blockType: 'contentColumns',
					columns: [{ heading: 'Clear space', image: 8 }, { image: 9 }],
				},
			],
		} as unknown as GuidelineDocument

		const snapshot = buildCheckSourceSnapshot(page)

		expect(snapshot?.evidence).toEqual({
			type: 'document',
			description: 'Approved applications',
			blocks: [
				{ type: 'contentColumns', columns: [{ heading: undefined, body: undefined }] },
				{
					type: 'contentColumns',
					columns: [
						{ heading: 'Clear space', body: undefined },
						{ heading: undefined, body: undefined },
					],
				},
			],
		})
		// 같은 이미지가 두 block에 걸쳐 있어도 (id, role) 기준으로 한 번만 남는다.
		expect(snapshot?.referenceAssets).toEqual([
			{ id: 8, role: 'context' },
			{ id: 9, role: 'context' },
		])
	})

	it('Topic 전체 snapshot은 header image와 자체 block만 포함한다', () => {
		const topic = {
			title: 'Brand Core',
			description: lexical('Foundation'),
			headerImage: { id: 3, name: 'Core', alt: 'Core visual' },
			blocks: [
				{ id: 'note', blockType: 'callout', kind: 'must', title: 'Main colors', items: [] },
			],
		} as unknown as GuidelineDocument

		expect(buildCheckSourceSnapshot(topic)).toEqual({
			evidence: {
				type: 'document',
				description: 'Foundation',
				blocks: [{ type: 'callout', kind: 'must', title: 'Main colors', items: [] }],
			},
			referenceAssets: [{ id: 3, role: 'context' }],
		})
	})

	it('존재하지 않는 blockId는 기존 snapshot을 지우지 않도록 null을 반환한다', () => {
		const page = { title: 'Logo', blocks: [] } as unknown as GuidelineDocument
		expect(buildCheckSourceSnapshot(page, 'missing')).toBeNull()
	})

	it('통합 문서로 옮긴 뒤에도 Rule 배치 개수와 evidence를 유지한다', () => {
		const rules = [{ id: 1, key: 'logo-size', title: 'Logo size' }]
		const blocks = [
			{
				id: 'usage',
				blockType: 'contentColumns',
				columns: [{ heading: 'Minimum', body: lexical('Use 24 px.') }],
				rules,
			},
		]
		const legacy = {
			title: 'Primary Logo',
			description: lexical('Approved usage'),
			blocks,
			rules,
		} as unknown as GuidelineDocument
		const unified = {
			...legacy,
			headerImage: null,
		} as never

		const legacySources = collectGuidelineCheckSources(legacy)
		const unifiedSources = collectGuidelineCheckSources(unified)

		expect(unifiedSources).toHaveLength(legacySources.length)
		expect(unifiedSources.map(({ rule, evidence }) => ({ key: rule.key, evidence }))).toEqual(
			legacySources.map(({ rule, evidence }) => ({ key: rule.key, evidence })),
		)
	})
})
