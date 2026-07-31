import { describe, expect, it, vi } from 'vitest'
import { listPublishedImageProfiles } from '@/features/generate-image/repositories/image-profile.payload.repository'
import { getImageProfileNavigation } from './list-image-profiles.service'

vi.mock('@/features/generate-image/repositories/image-profile.payload.repository', () => ({
	listPublishedImageProfiles: vi.fn(),
}))

describe('getImageProfileNavigation', () => {
	it('slug가 설정된 프로파일만 Studio 경로로 만든다', async () => {
		vi.mocked(listPublishedImageProfiles).mockResolvedValue([
			{ id: 1, name: 'Illustration', slug: 'illustration' },
			{ id: 2, name: '기존 프로파일', slug: null },
		])

		await expect(getImageProfileNavigation({ id: 1 })).resolves.toEqual([
			{
				id: 1,
				name: 'Illustration',
				slug: 'illustration',
				href: '/studio/generate/image/illustration',
			},
		])
	})
})
