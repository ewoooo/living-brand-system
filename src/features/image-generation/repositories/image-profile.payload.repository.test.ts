import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { findPublishedImageProfile } from './image-profile.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('findPublishedImageProfile', () => {
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
