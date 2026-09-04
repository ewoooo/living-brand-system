import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { collectGuidelineCheckSources } from './collect-guideline-check-sources'

describe('collectGuidelineCheckSources', () => {
	it('문서 Rule과 Block Rule에 서로 다른 evidence snapshot을 붙인다', () => {
		const page = {
			id: 12,
			title: 'Logo usage',
			rules: [{ id: 1, key: 'logo.page', title: 'Page Rule', checker: 1 }],
			blocks: [
				{
					id: 'logo-block',
					blockName: 'Logo examples',
					blockType: 'block',
					children: [{ id: 'w', blockType: 'logoDisplayWidget' }],
					rules: [{ id: 2, key: 'logo.block', title: 'Block Rule', checker: 1 }],
				},
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map(({ rule, source }) => [rule.key, source.documentId])).toEqual([
			['logo.page', 12],
			['logo.block', 12],
		])
		expect(sources.map(({ blockName }) => blockName)).toEqual([null, 'Logo examples'])
		expect(sources[0]?.evidence).toEqual({
			type: 'document',
			blocks: [{ type: 'block', childCount: 1 }],
		})
		expect(sources[1]?.evidence).toEqual({ type: 'block', childCount: 1 })
	})

	it('섹션 안 블록의 Rule도 섹션 위치를 달고 수집한다', () => {
		const page = {
			id: 12,
			title: 'Logo usage',
			blocks: [
				{
					id: 'sec',
					blockType: 'section',
					anchor: 'clear-space',
					title: 'Clear space',
					blocks: [
						{
							id: 'inner',
							blockType: 'block',
							children: [],
							rules: [
								{
									id: 2,
									key: 'logo.clear-space',
									title: 'Clear Space',
									checker: 1,
								},
							],
						},
					],
				},
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map(({ rule, source }) => [rule.key, source.section?.anchor])).toEqual([
			['logo.clear-space', 'clear-space'],
		])
	})

	it('populate되지 않은 Rule 관계(ID)는 실행 대상에서 제외한다', () => {
		const page = {
			id: 12,
			title: 'Logo usage',
			rules: [41, { id: 1, key: 'logo.page', title: 'Page Rule', checker: 1 }],
			blocks: [],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map(({ rule }) => rule.key)).toEqual(['logo.page'])
	})

	it('문서 Rule의 참조 자산은 헤더 이미지다 — 자식 위젯의 이미지는 넣지 않는다', () => {
		const image = {
			id: 66,
			name: 'Brand Guideline Reference p.37',
			url: '/api/application-images/file/page-37.jpg',
			mimeType: 'image/jpeg',
		}
		const page = {
			id: 46,
			title: 'Incorrect Usage',
			headerImage: image,
			rules: [
				{ id: 3, key: 'typography.misuse', title: '타이포그래피 오용 금지', checker: 1 },
			],
			blocks: [
				{ id: 'b', blockType: 'block', children: [{ id: 'i', blockType: 'image', image }] },
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources[0]?.referenceAssets).toEqual([{ asset: image, role: 'context' }])
	})
})
