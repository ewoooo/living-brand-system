import { describe, expect, it } from 'vitest'
import { getPageNavigationIndex } from './page-navigation'

const items = [
	{ title: '로고', href: '/guideline/brand/logo' },
	{ title: '색상', href: '/guideline/brand/color' },
]

describe('getPageNavigationIndex', () => {
	it('페이지 anchor가 바뀌어도 현재 섹션을 유지한다', () => {
		expect(getPageNavigationIndex(items, '/guideline/brand/logo', '#primary-logo')).toBe(0)
		expect(getPageNavigationIndex(items, '/guideline/brand/color', '')).toBe(1)
	})
})
