import { describe, expect, it } from 'vitest'
import { getPageNavigationIndex } from './page-navigation'

const items = [
	{ title: '검수 Check', href: '/review/rules' },
	{ title: '색상', href: '/review/rules#color' },
]

describe('getPageNavigationIndex', () => {
	it('현재 경로와 해시에 맞는 항목을 찾고 알 수 없는 해시는 페이지로 되돌린다', () => {
		expect(getPageNavigationIndex(items, '/review/rules', '#color')).toBe(1)
		expect(getPageNavigationIndex(items, '/review/rules', '#unknown')).toBe(0)
	})
})
