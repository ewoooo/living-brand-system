import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	env: {
		IMAGE_DEV_FALLBACK: undefined as 'true' | 'false' | undefined,
		NODE_ENV: 'test' as 'development' | 'production' | 'test',
		OPENAI_API_KEY: undefined as string | undefined,
	},
	devGenerateImages: vi.fn(),
	generateBrandImages: vi.fn(),
}))

vi.mock('@/env', () => ({ env: mocks.env }))
vi.mock('@/features/image-generation/repositories/dev-image-generation.rest.repository', () => ({
	devGenerateImages: mocks.devGenerateImages,
}))
vi.mock('@/features/image-generation/repositories/image-generation.ai.repository', () => ({
	generateBrandImages: mocks.generateBrandImages,
}))

import { generateImageCandidates, ImageGenerationUnavailableError } from './generate-image.service'

describe('generateImageCandidates', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.env.NODE_ENV = 'test'
		mocks.env.IMAGE_DEV_FALLBACK = undefined
		mocks.env.OPENAI_API_KEY = undefined
	})

	it('fails closed when no image provider is configured', async () => {
		mocks.env.NODE_ENV = 'production'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'

		await expect(
			generateImageCandidates({ userInput: 'sample', sceneId: 'free', count: 1 }),
		).rejects.toBeInstanceOf(ImageGenerationUnavailableError)
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('uses Pollinations only when development explicitly enables it', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.devGenerateImages.mockResolvedValue(['data:image/jpeg;base64,dev'])

		const result = await generateImageCandidates({
			userInput: 'sample',
			sceneId: 'free',
			count: 2,
		})

		expect(mocks.devGenerateImages).toHaveBeenCalledWith('sample', '1024x1024', 2)
		expect(result.images).toEqual(['data:image/jpeg;base64,dev'])
	})

	it('prefers the configured OpenAI provider', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.env.OPENAI_API_KEY = 'key'
		mocks.generateBrandImages.mockResolvedValue(['data:image/png;base64,openai'])

		await generateImageCandidates({ userInput: 'sample', sceneId: 'free', count: 1 })

		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: 'sample',
			count: 1,
			size: '1024x1024',
		})
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
	})
})
