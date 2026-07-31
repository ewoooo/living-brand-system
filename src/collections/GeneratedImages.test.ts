import { describe, expect, it } from 'vitest'
import { GeneratedImages } from './GeneratedImages'

describe('GeneratedImages collection', () => {
	it('keeps generation metadata private while exposing only published files publicly', async () => {
		const read = GeneratedImages.access?.read
		expect(typeof read).toBe('function')
		expect(
			await read?.({
				req: { user: { email: 'manager@example.com', role: 'manager' } },
			} as never),
		).toBe(true)
		expect(await read?.({ req: { user: null } } as never)).toEqual({
			_status: { equals: 'published' },
		})

		const inputPrompt = GeneratedImages.fields.find(
			(field) => 'name' in field && field.name === 'inputPrompt',
		)
		const metadataRead =
			inputPrompt && 'access' in inputPrompt ? inputPrompt.access?.read : undefined
		expect(typeof metadataRead).toBe('function')
		expect(await metadataRead?.({ req: { user: { role: 'worker' } } } as never)).toBe(false)
		expect(await metadataRead?.({ req: { user: { role: 'manager' } } } as never)).toBe(true)

		const remove = GeneratedImages.access?.delete
		expect(
			await remove?.({
				req: { user: { email: 'manager@example.com', role: 'manager' } },
			} as never),
		).toEqual({ _status: { equals: 'draft' } })
		expect(await remove?.({ req: { user: { role: 'worker' } } } as never)).toBe(false)
	})
})
