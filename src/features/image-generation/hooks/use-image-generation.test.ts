import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'

const RESPONSE = {
	aspectRatio: '16:9' as const,
	imageSize: '1K' as const,
	images: ['/file/a.png', '/file/b.png'],
	generatedImages: [
		{ collection: 'generated-images', createdAt: '', id: 1, url: '/file/a.png' },
		{ collection: 'generated-images', createdAt: '', id: 2, url: '/file/b.png' },
	],
	model: 'gpt-image-2',
	profileId: 5,
	prompt: '{"subject":"유조선"}',
}

function mockResponse(body: unknown, status = 200) {
	return vi
		.spyOn(globalThis, 'fetch')
		.mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

describe('useImageGeneration', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('참조 없는 생성은 참조가 비어 있는 세션을 만든다', async () => {
		mockResponse(RESPONSE)
		const { result } = renderHook(() => useImageGeneration())

		await act(() => result.current.generate({ count: 2, prompt: '유조선', profileId: 5 }))

		expect(result.current.session?.reference).toBeNull()
		expect(result.current.session?.images).toHaveLength(2)
		expect(result.current.selected).toBe(0)
	})

	it('참조 생성은 참조를 세션에 남긴다', async () => {
		mockResponse(RESPONSE)
		const { result } = renderHook(() => useImageGeneration())
		await act(() => result.current.generate({ count: 2, prompt: '유조선', profileId: 5 }))

		const reference = result.current.session?.images[1] ?? null
		mockResponse({ ...RESPONSE, images: ['/file/c.png'], generatedImages: [] })
		await act(() =>
			result.current.generate(
				{
					count: 1,
					prompt: '',
					profileId: 5,
					camera: { azimuthDeg: 90, elevationDeg: 0 },
					reference: { generatedImageId: 2 },
				},
				reference,
			),
		)

		expect(result.current.session?.reference).toEqual(reference)
		expect(result.current.session?.images).toHaveLength(1)
		// 참조가 0번을 차지하므로 첫 결과는 1번이다 — 저장 CTA가 결과를 가리켜야 한다.
		expect(result.current.selected).toBe(1)
	})

	it('서버의 안전한 오류 메시지를 화면 상태로 보존한다', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined)
		mockResponse({ message: 'Invalid seed image.' }, 400)
		const { result } = renderHook(() => useImageGeneration())

		await act(() => result.current.generate({ count: 1, prompt: '유조선', profileId: 5 }))

		expect(result.current.error).toBe('Invalid seed image.')
	})
})
