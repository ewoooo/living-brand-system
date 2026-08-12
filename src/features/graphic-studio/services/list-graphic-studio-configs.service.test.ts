import { describe, expect, it, vi } from 'vitest'
import { listPublishedGraphicProfileDefinitions } from '@/features/graphic-studio/repositories/graphic-profile.payload.repository'
import { listGraphicStudioConfigs } from './list-graphic-studio-configs.service'

vi.mock('@/features/graphic-studio/repositories/graphic-profile.payload.repository', () => ({
	listPublishedGraphicProfileDefinitions: vi.fn(),
}))

describe('listGraphicStudioConfigs', () => {
	it('published override가 있으면 같은 runtime 기본 Config를 대체하고 없으면 fallback한다', async () => {
		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([])
		await expect(listGraphicStudioConfigs({})).resolves.toEqual([
			expect.objectContaining({ id: 'forward-straight', name: 'Forward Straight' }),
		])

		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([
			{ id: 3, name: '브랜드 그래픽', runtime: 'forward-straight' },
		])
		await expect(listGraphicStudioConfigs({})).resolves.toEqual([
			expect.objectContaining({ id: 'forward-straight', name: '브랜드 그래픽' }),
		])
	})
})
