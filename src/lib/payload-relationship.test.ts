import { describe, expect, it } from 'vitest'
import { toRelationshipId } from './payload-relationship'

describe('toRelationshipId', () => {
	it('depth 0의 id와 populate된 문서를 같은 id로 좁힌다', () => {
		expect(toRelationshipId(3)).toBe(3)
		expect(toRelationshipId({ id: 3, title: 'Editorial' })).toBe(3)
	})

	it('id를 읽을 수 없는 값은 undefined다 — 0이나 NaN으로 무너지지 않는다', () => {
		for (const value of [undefined, null, '3', {}, { id: '3' }, [], Number.NaN]) {
			expect(toRelationshipId(value)).toBeUndefined()
		}
	})

	it('이미 좁혀진 값을 다시 좁혀도 같다', () => {
		const once = toRelationshipId({ id: 7 })
		expect(toRelationshipId(once)).toBe(once)
	})
})
