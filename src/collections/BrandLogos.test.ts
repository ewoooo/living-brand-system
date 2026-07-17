import { describe, expect, it } from 'vitest'
import { BrandLogos } from './BrandLogos'

type AccessFunction = (args: { req: { user: unknown } }) => unknown

function access(name: 'create' | 'delete' | 'read' | 'update'): AccessFunction {
	const rule = BrandLogos.access?.[name]
	if (typeof rule !== 'function') throw new Error(`${name} access is not configured`)
	return rule as unknown as AccessFunction
}

describe('BrandLogos access', () => {
	it('공개·worker 읽기는 published로 제한하고 manager/admin은 draft도 읽는다', () => {
		for (const user of [null, { role: 'worker' }]) {
			expect(access('read')({ req: { user } })).toEqual({
				_status: { equals: 'published' },
			})
		}
		for (const role of ['manager', 'admin']) {
			expect(access('read')({ req: { user: { role } } })).toBe(true)
		}
	})

	it('쓰기는 manager와 admin만 허용한다', () => {
		for (const operation of ['create', 'update', 'delete'] as const) {
			expect(access(operation)({ req: { user: null } })).toBe(false)
			expect(access(operation)({ req: { user: { role: 'worker' } } })).toBe(false)
			expect(access(operation)({ req: { user: { role: 'manager' } } })).toBe(true)
			expect(access(operation)({ req: { user: { role: 'admin' } } })).toBe(true)
		}
	})
})
