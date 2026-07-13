import { describe, expect, it } from 'vitest'
import type { GuidelinePage } from '@/payload-types'
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
		} as unknown as GuidelinePage

		const sources = collectGuidelineCheckSources(page)

		expect(sources.map((source) => [source.check.key, source.blockId])).toEqual([
			['logo.page', null],
			['logo.block', 'logo-block'],
		])
		expect(sources[0]?.evidence).toContain('Logo usage')
		expect(sources[1]?.evidence).toContain('Media showcase')
		expect(sources[1]?.referenceAssets).toEqual([image])
	})

	it('Block Check에서 동일한 기준 이미지를 중복 제거한다', () => {
		const image = {
			id: 66,
			name: 'Brand Guideline Reference p.37',
			url: '/api/application-images/file/page-37.jpg',
			mimeType: 'image/jpeg',
		}
		const page = {
			title: 'Incorrect Usage',
			blocks: [
				{
					id: 'incorrect-usage',
					blockType: 'doDont',
					groups: [
						{
							examples: [
								{ kind: 'dont', image },
								{ kind: 'dont', image },
							],
						},
					],
					checks: [
						{ key: 'typography.misuse', title: '타이포그래피 오용 금지', checker: 1 },
					],
				},
			],
		} as unknown as GuidelinePage

		const sources = collectGuidelineCheckSources(page)

		expect(sources[0]?.referenceAssets).toEqual([image])
	})
})
