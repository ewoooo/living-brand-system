import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'

describe('useImageGeneration', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('stores the generated result and requested image count', async () => {
		const response = {
			images: ['data:image/png;base64,result'],
			model: 'gpt-image-2',
			prompt: 'composed prompt',
		}
		const fetchImage = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))
		const { result } = renderHook(() => useImageGeneration())

		await act(() =>
			result.current.generate({
				count: 2,
				prompt: 'abstract background',
				profileId: 5,
			}),
		)

		expect(fetchImage).toHaveBeenCalledWith('/api/generate-image', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ count: 2, prompt: 'abstract background', profileId: 5 }),
		})
		expect(result.current.result).toEqual(response)
		expect(result.current.requested).toBe(2)
		expect(result.current.loading).toBe(false)
		// 선택이 비면 저장 CTA가 켜지지 않는다 — 결과가 오면 첫 장이 선택돼 있어야 한다.
		expect(result.current.selected).toBe(0)
	})

	it('서버의 안전한 오류 메시지를 화면 상태로 보존한다', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined)
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			Response.json({ message: 'Invalid seed image.' }, { status: 400 }),
		)
		const { result } = renderHook(() => useImageGeneration())

		await act(() =>
			result.current.adjustCamera({
				camera: { azimuthDeg: 0, elevationDeg: 0 },
				generatedImageId: 8,
				profileId: 5,
			}),
		)

		expect(result.current.error).toBe('Invalid seed image.')
	})
})
