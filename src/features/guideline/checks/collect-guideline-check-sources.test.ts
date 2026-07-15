import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { collectGuidelineCheckSources } from './collect-guideline-check-sources'

describe('collectGuidelineCheckSources', () => {
	it('문서 Check와 Block Check에 서로 다른 evidence snapshot을 붙인다', () => {
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
			checks: [{ key: 'logo.page', title: 'Page Check', checker: 1 }],
			blocks: [
				{
					id: 'logo-block',
					blockType: 'mediaShowcase',
					image,
					checks: [{ key: 'logo.block', title: 'Block Check', checker: 1 }],
				},
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map(({ check, source }) => [check.key, source.documentId])).toEqual([
			['logo.page', 12],
			['logo.block', 12],
		])
		expect(sources[0]?.evidence).toEqual({
			type: 'document',
			blocks: [{ type: 'mediaShowcase' }],
		})
		expect(sources[1]?.evidence).toEqual({ type: 'mediaShowcase' })
		expect(sources[1]?.referenceAssets).toEqual([{ asset: image, role: 'context' }])
	})

	it('Block Check에서 동일한 기준 이미지를 중복 제거한다', () => {
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
					checks: [
						{ key: 'typography.misuse', title: '타이포그래피 오용 금지', checker: 1 },
					],
				},
			],
		} as unknown as GuidelineDocument

		const sources = collectGuidelineCheckSources(page)

		expect(sources[0]?.referenceAssets).toEqual([{ asset: image, role: 'negative' }])
	})
})
