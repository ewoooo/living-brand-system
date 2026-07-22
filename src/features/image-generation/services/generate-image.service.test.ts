import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	env: {
		IMAGE_DEV_FALLBACK: undefined as 'true' | 'false' | undefined,
		NODE_ENV: 'test' as 'development' | 'production' | 'test',
		OPENAI_API_KEY: undefined as string | undefined,
	},
	devGenerateImages: vi.fn(),
	findPublishedImageProfile: vi.fn(),
	generateBrandImages: vi.fn(),
	normalizeImageProfilePrompt: vi.fn(),
}))

vi.mock('@/env', () => ({ env: mocks.env }))
vi.mock('@/features/image-generation/repositories/dev-image-generation.rest.repository', () => ({
	devGenerateImages: mocks.devGenerateImages,
}))
vi.mock('@/features/image-generation/repositories/image-generation.ai.repository', () => ({
	generateBrandImages: mocks.generateBrandImages,
}))
vi.mock('@/features/image-generation/repositories/image-profile.payload.repository', () => ({
	findPublishedImageProfile: mocks.findPublishedImageProfile,
}))
vi.mock('@/features/image-generation/services/normalize-image-profile-prompt.service', () => ({
	ImagePromptNormalizationUnavailableError: class extends Error {},
	normalizeImageProfilePrompt: mocks.normalizeImageProfilePrompt,
}))

import {
	generateImageCandidates,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
} from './generate-image.service'

describe('generateImageCandidates', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.env.NODE_ENV = 'test'
		mocks.env.IMAGE_DEV_FALLBACK = undefined
		mocks.env.OPENAI_API_KEY = undefined
		mocks.findPublishedImageProfile.mockResolvedValue(null)
	})

	it('fails closed when no image provider is configured', async () => {
		mocks.env.NODE_ENV = 'production'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'

		await expect(
			generateImageCandidates({ userInput: 'sample', count: 1 }),
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

		await generateImageCandidates({ userInput: 'sample', count: 1 })

		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: 'sample',
			count: 1,
			size: '1024x1024',
		})
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
	})

	it('published 프로파일을 정규화해 세로 이미지 프롬프트로 생성한다', async () => {
		mocks.env.OPENAI_API_KEY = 'key'
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: '에센허브 브랜드 제품컷',
			profilePrompt: [{ key: 'style', value: 'minimalist' }],
			userPromptNormalization: [{ key: 'mood', candidates: [{ value: 'organic' }] }],
		})
		mocks.normalizeImageProfilePrompt.mockResolvedValue({
			finalPrompt: { style: 'minimalist', mood: 'organic', subject: '파란 세럼병' },
			normalizedInput: { mood: 'organic' },
		})
		mocks.generateBrandImages.mockResolvedValue(['data:image/png;base64,profile'])
		const user = { id: 1 }

		await expect(
			generateImageCandidates({
				userInput: '파란 세럼병',
				profileId: 5,
				user,
				count: 2,
			}),
		).resolves.toEqual({
			images: ['data:image/png;base64,profile'],
			prompt: JSON.stringify({
				style: 'minimalist',
				mood: 'organic',
				subject: '파란 세럼병',
			}),
			profileId: 5,
			profileName: '에센허브 브랜드 제품컷',
		})
		expect(mocks.findPublishedImageProfile).toHaveBeenCalledWith(user, 5)
		expect(mocks.normalizeImageProfilePrompt).toHaveBeenCalledWith({
			profilePrompt: [{ key: 'style', value: 'minimalist' }],
			userPromptNormalization: [{ key: 'mood', candidates: [{ value: 'organic' }] }],
			userPrompt: '파란 세럼병',
		})
		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: JSON.stringify({
				style: 'minimalist',
				mood: 'organic',
				subject: '파란 세럼병',
			}),
			count: 2,
			size: '1024x1536',
		})
	})

	it('published 프로파일이 없으면 생성기를 호출하지 않는다', async () => {
		mocks.env.OPENAI_API_KEY = 'key'

		await expect(
			generateImageCandidates({
				userInput: 'sample',
				profileId: 404,
				user: { id: 1 },
				count: 1,
			}),
		).rejects.toBeInstanceOf(ImageProfileNotFoundError)
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})
})
