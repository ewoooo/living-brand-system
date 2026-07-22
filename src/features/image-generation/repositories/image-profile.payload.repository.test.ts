import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	findPublishedImageProfile,
	listPublishedImageProfiles,
} from './image-profile.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('findPublishedImageProfile', () => {
	it('선택 목록은 published 프로파일의 id와 이름만 반환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{ id: 5, name: '에센허브 브랜드 제품컷' },
				{ id: 7, name: '다른 프로파일' },
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)
		const user = { id: 1 }

		await expect(listPublishedImageProfiles(user)).resolves.toEqual([
			{ id: 5, name: '에센허브 브랜드 제품컷' },
			{ id: 7, name: '다른 프로파일' },
		])
		expect(find).toHaveBeenCalledWith({
			collection: 'image-profiles',
			depth: 0,
			draft: false,
			limit: 100,
			overrideAccess: false,
			select: { name: true },
			sort: 'name',
			user,
			where: { _status: { equals: 'published' } },
		})
	})

	it('사용자 권한으로 published 프로파일만 조회한다', async () => {
		const profile = { id: 5, name: '에센허브 브랜드 제품컷' }
		const find = vi.fn().mockResolvedValue({ docs: [profile] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)
		const user = { id: 1 }

		await expect(findPublishedImageProfile(user, 5)).resolves.toBe(profile)
		expect(find).toHaveBeenCalledWith({
			collection: 'image-profiles',
			depth: 0,
			draft: false,
			limit: 1,
			overrideAccess: false,
			user,
			where: {
				and: [{ id: { equals: 5 } }, { _status: { equals: 'published' } }],
			},
		})
	})
})
