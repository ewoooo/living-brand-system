import { describe, expect, it } from 'vitest'
import { ApplicationImages } from './ApplicationImages'

type AccessFunction = (args: { req: { user: unknown } }) => unknown

function access(name: 'create' | 'delete' | 'read' | 'update'): AccessFunction {
	const rule = ApplicationImages.access?.[name]
	if (typeof rule !== 'function') throw new Error(`${name} access is not configured`)
	return rule as unknown as AccessFunction
}

describe('ApplicationImages access', () => {
	it('공개·worker 읽기는 published로 제한하고 manager는 draft도 읽는다', () => {
		expect(access('read')({ req: { user: null } })).toEqual({
			_status: { equals: 'published' },
		})
		expect(access('read')({ req: { user: { role: 'worker' } } })).toEqual({
			_status: { equals: 'published' },
		})
		expect(access('read')({ req: { user: { role: 'manager' } } })).toBe(true)
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
