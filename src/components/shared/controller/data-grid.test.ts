import { describe, expect, it } from 'vitest'
import { formatGrid, parseGrid } from './data-grid'

describe('controller data grid', () => {
	it('탭과 쉼표 둘 다 칸으로 읽고 탭으로 되돌려 쓴다', () => {
		expect(parseGrid('A\t1\nB\t2')).toEqual([
			['A', '1'],
			['B', '2'],
		])
		expect(formatGrid(parseGrid('A,1\nB,2'))).toBe('A\t1\nB\t2')
	})

	it('빈 줄은 행이 아니다', () => {
		expect(parseGrid('A\t1\n\n\nB\t2')).toHaveLength(2)
	})

	it('격자를 거쳐도 값이 보존된다', () => {
		const text = '항목 A\t34\n항목 B\t33'
		expect(formatGrid(parseGrid(text))).toBe(text)
	})
})
