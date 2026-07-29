import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	env: {
		GEMINI_API_KEY: 'google-key',
	},
	createGoogle: vi.fn(),
	generateImage: vi.fn(),
	googleImage: vi.fn(),
	openaiImage: vi.fn(),
}))

vi.mock('@/env', () => ({ env: mocks.env }))
vi.mock('ai', () => ({ generateImage: mocks.generateImage }))
vi.mock('@ai-sdk/google', () => ({
	createGoogle: mocks.createGoogle,
}))
vi.mock('@ai-sdk/openai', () => ({
	openai: { image: mocks.openaiImage },
}))

import { generateBrandImages } from './image-generation.ai.repository'

describe('generateBrandImages', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.createGoogle.mockReturnValue({ image: mocks.googleImage })
		mocks.googleImage.mockReturnValue('google-model')
		mocks.openaiImage.mockReturnValue('openai-model')
		mocks.generateImage.mockResolvedValue({
			image: { base64: 'google', mediaType: 'image/png' },
		})
	})

	it('Nano Banana 후보 수만큼 16:9 이미지를 직접 생성한다', async () => {
		await expect(
			generateBrandImages({
				prompt: 'technical excavator',
				count: 2,
				modelPreset: 'google-nano-banana-2-lite',
				aspectRatio: '16:9',
				imageSize: '1K',
			}),
		).resolves.toEqual({
			images: ['data:image/png;base64,google', 'data:image/png;base64,google'],
			model: 'gemini-3.1-flash-lite-image',
			provider: 'google',
		})

		expect(mocks.createGoogle).toHaveBeenCalledWith({ apiKey: 'google-key' })
		expect(mocks.googleImage).toHaveBeenCalledWith('gemini-3.1-flash-lite-image')
		expect(mocks.generateImage).toHaveBeenCalledTimes(2)
		expect(mocks.generateImage).toHaveBeenCalledWith({
			model: 'google-model',
			prompt: 'technical excavator',
			providerOptions: {
				google: {
					imageConfig: {
						aspectRatio: '16:9',
						imageSize: '1K',
					},
				},
			},
		})
	})

	it('gpt-image-2의 16:9 4K 계약을 유효한 픽셀 크기로 변환한다', async () => {
		mocks.generateImage.mockResolvedValueOnce({
			images: [{ base64: 'openai', mediaType: 'image/png' }],
		})

		await generateBrandImages({
			prompt: 'technical excavator',
			count: 1,
			modelPreset: 'openai-gpt-image-2',
			aspectRatio: '16:9',
			imageSize: '4K',
		})

		expect(mocks.generateImage).toHaveBeenCalledWith({
			model: 'openai-model',
			prompt: 'technical excavator',
			n: 1,
			size: '3840x2160',
		})
		expect(mocks.openaiImage).toHaveBeenCalledWith('gpt-image-2')
	})
})
