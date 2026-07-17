import { describe, expect, it } from 'vitest'
import { TemplateAssets } from './TemplateAssets'

type AccessFunction = (args: { req: { user: unknown } }) => unknown

function access(name: 'create' | 'delete' | 'read' | 'update'): AccessFunction {
	const rule = TemplateAssets.access?.[name]
	if (typeof rule !== 'function') throw new Error(`${name} access is not configured`)
	return rule as unknown as AccessFunction
}

describe('TemplateAssets access', () => {
	it('staging 에셋은 manager/admin만 읽고 쓴다', () => {
		for (const operation of ['read', 'create', 'update', 'delete'] as const) {
			expect(access(operation)({ req: { user: null } })).toBe(false)
			expect(access(operation)({ req: { user: { role: 'worker' } } })).toBe(false)
			expect(access(operation)({ req: { user: { role: 'manager' } } })).toBe(true)
			expect(access(operation)({ req: { user: { role: 'admin' } } })).toBe(true)
		}
	})
})
