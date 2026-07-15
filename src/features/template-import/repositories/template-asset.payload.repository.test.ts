import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/payload-types'
import { storeTemplateAsset } from './template-asset.payload.repository'

const find = vi.fn()
const create = vi.fn()
const remove = vi.fn()
const payload = { find, create, delete: remove } as unknown as Payload
const user = { id: 1, role: 'manager' } as User

const input = {
	checksum: 'abc123',
	data: Buffer.from('<svg/>'),
	filename: 'figma-1-2-abc123.svg',
	mimeType: 'image/svg+xml',
}

describe('storeTemplateAsset', () => {
	beforeEach(() => vi.resetAllMocks())

	it('같은 checksum의 기존 업로드가 있으면 새 파일을 만들지 않고 재사용한다', async () => {
		find.mockResolvedValue({
			docs: [{ id: 7, url: '/api/template-assets/file/existing.svg' }],
		})

		await expect(storeTemplateAsset(payload, user, input)).resolves.toEqual({
			id: 7,
			url: '/api/template-assets/file/existing.svg',
			created: false,
		})
		expect(create).not.toHaveBeenCalled()
		expect(find).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess: false, user }))
	})

	it('기존 파일이 없으면 Payload upload로 생성한다', async () => {
		find.mockResolvedValue({ docs: [] })
		create.mockResolvedValue({
			id: 8,
			url: '/api/template-assets/file/figma-1-2-abc123.svg',
		})

		await expect(storeTemplateAsset(payload, user, input)).resolves.toEqual({
			id: 8,
			url: '/api/template-assets/file/figma-1-2-abc123.svg',
			created: true,
		})
		expect(create).toHaveBeenCalledWith({
			collection: 'template-assets',
			data: { checksum: 'abc123' },
			file: {
				data: input.data,
				mimetype: 'image/svg+xml',
				name: 'figma-1-2-abc123.svg',
				size: input.data.byteLength,
			},
			overrideAccess: false,
			user,
		})
	})

	it('생성 문서에 URL이 없으면 업로드를 제거하고 실패한다', async () => {
		find.mockResolvedValue({ docs: [] })
		create.mockResolvedValue({ id: 9, url: null })
		remove.mockResolvedValue({})

		await expect(storeTemplateAsset(payload, user, input)).rejects.toThrow(
			'Stored template asset has no URL.',
		)
		expect(remove).toHaveBeenCalledWith({
			collection: 'template-assets',
			id: 9,
			overrideAccess: false,
			user,
		})
	})
})
