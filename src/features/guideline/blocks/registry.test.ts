import { describe, expect, it } from 'vitest'
import type { GuidelinePage } from '@/payload-types'
import { deriveRuleRefsFromBlocks } from './registry'

describe('deriveRuleRefsFromBlocks', () => {
	it('블록에 중복 배치된 룰을 하나의 역참조로 만든다', () => {
		const blocks = [
			{ blockType: 'mediaShowcase', rule: 7 },
			{ blockType: 'colorPalette', rule: 7, colors: [1] },
			{ blockType: 'mediaShowcase', rule: 9 },
			{ blockType: 'doDont', groups: [{ rule: { id: 9 } }, { rule: 11 }] },
		] as GuidelinePage['blocks']

		expect(deriveRuleRefsFromBlocks(blocks)).toEqual([{ rule: 7 }, { rule: 9 }, { rule: 11 }])
	})
})
