import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { listPublishedGraphicProfileDefinitions } from './graphic-profile.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listPublishedGraphicProfileDefinitions', () => {
	it('사용자 권한으로 published 안전 필드만 조회한다', async () => {
		const docs = [{ id: 3, name: 'Forward', runtime: 'forward-straight', controller: null }]
		const find = vi.fn().mockResolvedValue({ docs })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)
		const user = { email: 'worker@example.com', id: 1, role: 'worker' }

		await expect(listPublishedGraphicProfileDefinitions(user)).resolves.toEqual(docs)
		expect(find).toHaveBeenCalledWith({
			collection: 'graphic-profiles',
			depth: 0,
			draft: false,
			limit: 100,
			overrideAccess: false,
			select: { controller: true, name: true, runtime: true },
			sort: 'displayOrder',
			user,
			where: { _status: { equals: 'published' } },
		})
	})

	it('Payload 사용자가 아니면 조회하지 않는다', async () => {
		const find = vi.fn()
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(listPublishedGraphicProfileDefinitions({ id: 1 })).rejects.toThrow(
			'Authenticated graphic profile consumer is required.',
		)
		expect(find).not.toHaveBeenCalled()
	})
})
