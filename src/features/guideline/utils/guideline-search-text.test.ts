import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { buildGuidelineSearchText } from './guideline-search-text'

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

describe('buildGuidelineSearchText', () => {
	it('제목, 경로, 설명, 블록 본문과 Check를 검색문으로 평탄화한다', () => {
		const document = {
			id: 55,
			title: 'Brand Model',
			slug: 'brand-model',
			breadcrumbs: [
				{ label: 'Design Elements' },
				{ label: 'Photography' },
				{ label: 'Brand Model' },
			],
			description: lexical('자연스러운 피부 질감과 모델 촬영 기준'),
			checks: [{ key: 'imagery-misuse', title: 'Imagery Misuse' }],
			blocks: [
				{
					id: 'examples',
					blockType: 'doDont',
					title: 'Examples',
					groups: [
						{
							kind: 'dont',
							description: '과도한 피부 보정을 피합니다.',
							examples: [],
						},
					],
				},
			],
		} as unknown as GuidelineDocument

		const searchText = buildGuidelineSearchText(document)

		expect(searchText).toContain('Design Elements Photography Brand Model')
		expect(searchText).toContain('자연스러운 피부 질감과 모델 촬영 기준')
		expect(searchText).toContain('과도한 피부 보정을 피합니다.')
		expect(searchText).toContain('imagery-misuse Imagery Misuse')
	})
})
