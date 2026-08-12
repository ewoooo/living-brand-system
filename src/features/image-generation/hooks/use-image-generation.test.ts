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
	})
})
