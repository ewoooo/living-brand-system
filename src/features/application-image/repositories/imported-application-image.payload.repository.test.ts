import type { Payload, PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/payload-types'
import {
	deleteDraftImportedApplicationImage,
	publishDraftImportedApplicationImages,
	storeDraftImportedApplicationImage,
} from './imported-application-image.payload.repository'

const find = vi.fn()
const create = vi.fn()
const remove = vi.fn()
const update = vi.fn()
const payload = { find, create, delete: remove, update } as unknown as Payload
const user = { id: 1, role: 'manager' } as User
const input = {
	data: Buffer.from('<svg/>'),
	filename: 'figma-abc123.svg',
	mimeType: 'image/svg+xml',
	name: 'Logo',
}

describe('Imported ApplicationImage repository', () => {
	beforeEach(() => vi.resetAllMocks())

	it('같은 filename의 기존 Application Images 문서는 재사용한다', async () => {
		find.mockResolvedValue({
			docs: [{ id: 7, url: '/api/application-images/file/figma-abc123.svg' }],
		})

		await expect(storeDraftImportedApplicationImage(payload, user, input)).resolves.toEqual({
			collection: 'application-images',
			id: 7,
			url: '/api/application-images/file/figma-abc123.svg',
			created: false,
		})
		expect(create).not.toHaveBeenCalled()
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'application-images', draft: true }),
		)
	})

	it('없으면 required 메타데이터와 파일을 draft로 생성한다', async () => {
		find.mockResolvedValue({ docs: [] })
		create.mockResolvedValue({
			id: 8,
			url: '/api/application-images/file/figma-abc123.svg',
		})

		await expect(
			storeDraftImportedApplicationImage(payload, user, input),
		).resolves.toMatchObject({
			collection: 'application-images',
			id: 8,
			created: true,
		})
		expect(create).toHaveBeenCalledWith({
			collection: 'application-images',
			data: { name: 'Logo', alt: 'Logo', _status: 'draft' },
			draft: true,
			file: {
				data: input.data,
				mimetype: 'image/svg+xml',
				name: 'figma-abc123.svg',
				size: input.data.byteLength,
			},
			overrideAccess: false,
			user,
		})
	})

	it('생성 결과 URL이 없으면 draft를 제거하고 실패한다', async () => {
		find.mockResolvedValue({ docs: [] })
		create.mockResolvedValue({ id: 9, url: null })

		await expect(storeDraftImportedApplicationImage(payload, user, input)).rejects.toThrow(
			'Stored Figma asset has no URL.',
		)
		expect(remove).toHaveBeenCalledWith({
			collection: 'application-images',
			id: 9,
			overrideAccess: false,
			user,
		})
	})

	it('실패 cleanup은 지정한 draft만 삭제한다', async () => {
		await deleteDraftImportedApplicationImage(payload, user, 10)

		expect(remove).toHaveBeenCalledWith({
			collection: 'application-images',
			id: 10,
			overrideAccess: false,
			user,
		})
	})

	it('중복 id를 제거하고 최신 상태가 draft인 에셋만 같은 req 트랜잭션에서 발행한다', async () => {
		const req = { payload } as unknown as PayloadRequest
		find.mockResolvedValue({
			docs: [
				{ id: 7, _status: 'draft' },
				{ id: 8, _status: 'published' },
			],
		})

		await publishDraftImportedApplicationImages(req, [7, 7, 8])

		expect(find).toHaveBeenCalledWith({
			collection: 'application-images',
			depth: 0,
			draft: true,
			limit: 2,
			overrideAccess: true,
			req,
			where: { id: { in: [7, 8] } },
		})
		expect(update).toHaveBeenCalledTimes(1)
		expect(update).toHaveBeenCalledWith({
			collection: 'application-images',
			id: 7,
			data: { _status: 'published' },
			overrideAccess: true,
			req,
		})
	})
})
