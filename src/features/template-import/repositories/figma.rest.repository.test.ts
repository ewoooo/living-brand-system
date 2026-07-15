import { afterEach, describe, expect, it, vi } from 'vitest'
import { findFigmaImageUrls } from './figma.rest.repository'

vi.mock('@/env', () => ({ env: { FIGMA_API_TOKEN: 'token' } }))

describe('findFigmaImageUrls', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('SVG는 원본 노드 전체 크기를 유지해 렌더링한다', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ images: { '1:2': 'https://figma.example/logo.svg' } }),
		})
		vi.stubGlobal('fetch', fetchMock)

		await findFigmaImageUrls('file', ['1:2'], 'svg')

		expect(fetchMock.mock.calls[0]?.[0]).toContain('format=svg&use_absolute_bounds=true')
	})
})
