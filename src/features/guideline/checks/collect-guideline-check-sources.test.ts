import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { collectGuidelineCheckSources } from './collect-guideline-check-sources'

describe('collectGuidelineCheckSources', () => {
	it('문서 Rule과 Block Rule에 서로 다른 evidence snapshot을 붙인다', () => {
		const image = {
			id: 7,
			name: 'Logo reference',
			url: '/api/application-images/file/logo.png',
			mimeType: 'image/png',
		}
		const page = {
			id: 12,
			title: 'Logo usage',
			description: null,
			rules: [{ id: 1, key: 'logo.page', title: 'Page Rule', checker: 1 }],
			blocks: [
				{
					id: 'logo-block',
					blockName: 'Logo examples',
					blockType: 'mediaShowcase',
					images: [{ image }],
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
			blocks: [{ type: 'mediaShowcase' }],
		})
		expect(sources[1]?.evidence).toEqual({ type: 'mediaShowcase' })
		expect(sources[1]?.referenceAssets).toEqual([{ asset: image, role: 'context' }])
	})

	it('populate되지 않은 Rule 관계(ID)는 실행 대상에서 제외한다', () => {
		const page = {
			id: 12,
			title: 'Logo usage',
			description: null,
			rules: [41, { id: 1, key: 'logo.page', title: 'Page Rule', checker: 1 }],
			blocks: [],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map(({ rule }) => rule.key)).toEqual(['logo.page'])
	})

	it('Block Rule에서 동일한 기준 이미지를 중복 제거한다', () => {
		const image = {
			id: 66,
			name: 'Brand Guideline Reference p.37',
			url: '/api/application-images/file/page-37.jpg',
			mimeType: 'image/jpeg',
		}
		const page = {
			id: 46,
			title: 'Incorrect Usage',
			blocks: [
				{
					id: 'incorrect-usage',
					blockType: 'doDont',
					groups: [
						{
							kind: 'dont',
							examples: [{ image }, { image }],
						},
					],
					rules: [
						{
							id: 3,
							key: 'typography.misuse',
							title: '타이포그래피 오용 금지',
							checker: 1,
						},
					],
				},
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources[0]?.referenceAssets).toEqual([{ asset: image, role: 'negative' }])
	})
})
