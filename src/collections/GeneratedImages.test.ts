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

	it('참조 원본을 매니저 전용 관계 필드로 보관한다', async () => {
		const sourceImage = GeneratedImages.fields.find(
			(field) => 'name' in field && field.name === 'sourceImage',
		)
		expect(sourceImage).toBeDefined()
		expect(sourceImage && 'relationTo' in sourceImage ? sourceImage.relationTo : null).toBe(
			'generated-images',
		)
		// 참조 없이 만든 이미지가 다수이므로 필수가 아니어야 한다.
		expect(sourceImage && 'required' in sourceImage ? sourceImage.required : false).toBeFalsy()

		const read = sourceImage && 'access' in sourceImage ? sourceImage.access?.read : undefined
		expect(await read?.({ req: { user: { role: 'worker' } } } as never)).toBe(false)
		expect(await read?.({ req: { user: { role: 'manager' } } } as never)).toBe(true)
	})
})
