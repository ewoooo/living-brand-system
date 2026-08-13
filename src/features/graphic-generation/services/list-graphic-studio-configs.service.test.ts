import { describe, expect, it, vi } from 'vitest'
import { listPublishedGraphicProfileDefinitions } from '@/features/graphic-generation/repositories/graphic-profile.payload.repository'
import { canRenderGraphicStudioSvg } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import { listGraphicStudioConfigs } from './list-graphic-studio-configs.service'

vi.mock('@/features/graphic-generation/repositories/graphic-profile.payload.repository', () => ({
	listPublishedGraphicProfileDefinitions: vi.fn(),
}))
vi.mock('@/features/graphic-generation/runtime/graphic-studio-runtime', () => ({
	canRenderGraphicStudioSvg: vi.fn((config) => config.id === 'forward-straight'),
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

	it('Template용 목록은 SVG adapter가 없는 Shader runtime을 제외한다', async () => {
		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([
			{ id: 3, name: 'SVG', runtime: 'forward-straight' },
			{ id: 4, name: 'Shader', runtime: 'radial-fluted-glass' },
		])
		await expect(listGraphicStudioConfigs({}, { svgOnly: true })).resolves.toEqual([
			expect.objectContaining({ id: 'forward-straight' }),
		])
	})

	it('SVG 선언이 있어도 실제 adapter가 없으면 Template용 목록에서 제외한다', async () => {
		vi.mocked(listPublishedGraphicProfileDefinitions).mockResolvedValueOnce([
			{ id: 3, name: 'SVG', runtime: 'forward-straight' },
		])
		vi.mocked(canRenderGraphicStudioSvg).mockReturnValueOnce(false)

		await expect(listGraphicStudioConfigs({}, { svgOnly: true })).resolves.toEqual([])
	})
})
