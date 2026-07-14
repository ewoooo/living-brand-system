import { describe, expect, it } from 'vitest'
import type { GuidelinePage, GuidelineSection } from '@/payload-types'
import { collectGuidelineCheckSources } from '../checks/collect-guideline-check-sources'
import { buildCheckSourceSnapshot } from './check-source-snapshot'

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

describe('buildCheckSourceSnapshot', () => {
	it('blockId가 있으면 해당 block의 텍스트와 이미지 ID만 반환한다', () => {
		const page = {
			title: 'Logo',
			blocks: [
				{
					id: 'target',
					blockType: 'columnUnit',
					columns: [{ heading: 'Digital', body: lexical('Use 24 px.'), image: 7 }],
				},
				{ id: 'other', blockType: 'mediaShowcase', image: 8 },
			],
		} as unknown as GuidelinePage

		expect(buildCheckSourceSnapshot(page, 'target')).toEqual({
			evidence: 'Digital\nUse 24 px.',
			referenceAssets: [7],
		})
	})

	it('Page 전체 snapshot은 설명과 모든 block을 합치고 이미지 ID를 중복 제거한다', () => {
		const page = {
			title: 'Logo usage',
			description: lexical('Approved applications'),
			blocks: [
				{ id: 'one', blockType: 'mediaShowcase', image: 8 },
				{
					id: 'two',
					blockType: 'doDont',
					groups: [
						{
							category: 'Placement',
							examples: [{ kind: 'do', caption: 'Clear', image: 8 }],
						},
					],
				},
			],
		} as unknown as GuidelinePage

		const snapshot = buildCheckSourceSnapshot(page)

		expect(snapshot?.evidence).toContain('Logo usage\n\nApproved applications')
		expect(snapshot?.evidence).toContain('권장: Clear')
		expect(snapshot?.referenceAssets).toEqual([8])
	})

	it('Section 전체 snapshot은 header image와 자체 block만 포함한다', () => {
		const section = {
			title: 'Brand Core',
			chapter: 1,
			description: 'Foundation',
			headerImage: { id: 3, name: 'Core', alt: 'Core visual' },
			pages: { docs: [{ id: 9, title: 'Child page' }] },
			blocks: [
				{ id: 'palette', blockType: 'colorPalette', title: 'Main colors', colors: [] },
			],
		} as unknown as GuidelineSection

		expect(buildCheckSourceSnapshot(section)).toEqual({
			evidence: 'Brand Core\n\nFoundation\n\nCore visual Core\n\nMain colors',
			referenceAssets: [3],
		})
	})

	it('존재하지 않는 blockId는 기존 snapshot을 지우지 않도록 null을 반환한다', () => {
		const page = { title: 'Logo', blocks: [] } as unknown as GuidelinePage
		expect(buildCheckSourceSnapshot(page, 'missing')).toBeNull()
	})

	it('통합 문서로 옮긴 뒤에도 Check 개수와 evidence를 유지한다', () => {
		const checks = [{ key: 'logo-size', title: 'Logo size' }]
		const blocks = [
			{
				id: 'usage',
				blockType: 'columnUnit',
				columns: [{ heading: 'Minimum', body: lexical('Use 24 px.') }],
				checks,
			},
		]
		const legacy = {
			title: 'Primary Logo',
			description: lexical('Approved usage'),
			blocks,
			checks,
		} as unknown as GuidelinePage
		const unified = {
			...legacy,
			headerImage: null,
		} as never

		const legacySources = collectGuidelineCheckSources(legacy)
		const unifiedSources = collectGuidelineCheckSources(unified)

		expect(unifiedSources).toHaveLength(legacySources.length)
		expect(unifiedSources.map(({ check, evidence }) => ({ key: check.key, evidence }))).toEqual(
			legacySources.map(({ check, evidence }) => ({ key: check.key, evidence })),
		)
	})
})
