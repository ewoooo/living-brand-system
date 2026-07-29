import { describe, expect, it } from 'vitest'
import { filterStudioExamples } from './studio-examples'

describe('filterStudioExamples', () => {
	it('선택한 카테고리의 예제만 반환한다', () => {
		expect(filterStudioExamples('이미지')).toHaveLength(2)
		expect(
			filterStudioExamples('이미지').every((example) => example.category === '이미지'),
		).toBe(true)
	})
})
