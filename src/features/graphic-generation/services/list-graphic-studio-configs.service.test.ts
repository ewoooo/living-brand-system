import { describe, expect, it, vi } from 'vitest'
import { listPublishedGraphicProfileDefinitions } from '@/features/graphic-generation/repositories/graphic-profile.payload.repository'
import { canRenderGraphicStudioSvg } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import { listGraphicStudioConfigs } from './list-graphic-studio-configs.service'

vi.mock('@/features/graphic-generation/repositories/graphic-profile.payload.repository', () => ({
	listPublishedGraphicProfileDefinitions: vi.fn(),
}))
vi.mock('@/features/graphic-generation/runtime/graphic-studio-runtime', () => ({
	canRenderGraphicStudioSvg: vi.fn(),
}))

describe('listGraphicStudioConfigs', () => {
	it('published profile만 Effective Config로 노출한다', async () => {
		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([])
		await expect(listGraphicStudioConfigs({})).resolves.toEqual([])

		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([
			{ id: 3, name: '브랜드 그래픽', runtime: 'forward-straight' },
		])
		await expect(listGraphicStudioConfigs({})).resolves.toEqual([
			expect.objectContaining({ id: 'forward-straight', name: '브랜드 그래픽' }),
		])
	})

	it('Template용 목록은 output 선언이 아니라 실제 SVG adapter 가용성으로 거른다', async () => {
		vi.mocked(canRenderGraphicStudioSvg).mockImplementation(
			(config) => config.name === 'SVG adapter 있음',
		)
		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([
			{ id: 3, name: 'SVG adapter 없음', runtime: 'forward-straight' },
			{ id: 4, name: 'SVG adapter 있음', runtime: 'forward-straight' },
		])
		await expect(listGraphicStudioConfigs({}, { svgOnly: true })).resolves.toEqual([
			expect.objectContaining({ name: 'SVG adapter 있음' }),
		])
	})
})
