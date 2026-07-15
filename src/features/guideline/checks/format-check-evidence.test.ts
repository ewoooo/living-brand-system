import { describe, expect, it } from 'vitest'
import { formatCheckEvidence } from './format-check-evidence'

describe('formatCheckEvidence', () => {
	it('구조화된 문서 evidence를 기존 평문 소비자용으로 변환한다', () => {
		expect(
			formatCheckEvidence({
				type: 'document',
				description: 'Logo usage',
				blocks: [
					{
						type: 'columnUnit',
						columns: [{ heading: 'Minimum size', body: 'Use at least 24 px.' }],
					},
				],
			}),
		).toBe('Logo usage\n\nMinimum size\nUse at least 24 px.')
	})

	it('기존 CheckSession의 문자열 evidence를 그대로 유지한다', () => {
		expect(formatCheckEvidence('legacy evidence')).toBe('legacy evidence')
	})
})
