import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	env: {
		IMAGE_DEV_FALLBACK: undefined as 'true' | 'false' | undefined,
		GEMINI_API_KEY: undefined as string | undefined,
		NODE_ENV: 'test' as 'development' | 'production' | 'test',
		OPENAI_API_KEY: undefined as string | undefined,
	},
	devGenerateImages: vi.fn(),
	findPublishedImageProfile: vi.fn(),
	generateBrandImages: vi.fn(),
	normalizeImageProfilePrompt: vi.fn(),
}))

vi.mock('@/env', () => ({ env: mocks.env }))
vi.mock('@/features/generate-image/repositories/dev-image-generation.rest.repository', () => ({
	devGenerateImages: mocks.devGenerateImages,
}))
vi.mock('@/features/generate-image/repositories/image-generation.ai.repository', () => ({
	generateBrandImages: mocks.generateBrandImages,
}))
vi.mock('@/features/generate-image/repositories/image-profile.payload.repository', () => ({
	findPublishedImageProfile: mocks.findPublishedImageProfile,
}))
vi.mock('@/features/generate-image/services/normalize-image-profile-prompt.service', () => ({
	ImagePromptNormalizationUnavailableError: class extends Error {},
	normalizeImageProfilePrompt: mocks.normalizeImageProfilePrompt,
}))

import {
	generateImages,
	generateImagesWithSettings,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
} from './generate-image.service'

describe('generateImages', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.env.NODE_ENV = 'test'
		mocks.env.IMAGE_DEV_FALLBACK = undefined
		mocks.env.GEMINI_API_KEY = undefined
		mocks.env.OPENAI_API_KEY = undefined
		mocks.findPublishedImageProfile.mockResolvedValue(null)
	})

	it('fails closed when no image provider is configured', async () => {
		mocks.env.NODE_ENV = 'production'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'

		await expect(generateImages({ userInput: 'sample', count: 1 })).rejects.toBeInstanceOf(
			ImageGenerationUnavailableError,
		)
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('uses Pollinations only when development explicitly enables it', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.devGenerateImages.mockResolvedValue(['data:image/jpeg;base64,dev'])

		const result = await generateImages({
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
		mocks.generateBrandImages.mockResolvedValue({
			images: ['data:image/png;base64,openai'],
			model: 'gpt-image-2',
			provider: 'openai',
		})

		await generateImages({ userInput: 'sample', count: 1 })

		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: 'sample',
			count: 1,
			modelPreset: 'openai-gpt-image-2',
			aspectRatio: '1:1',
			imageSize: '1K',
		})
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
	})

	it('published 프로파일을 정규화해 저장된 출력 계약으로 생성한다', async () => {
		mocks.env.OPENAI_API_KEY = 'key'
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'openai-gpt-image-2',
			aspectRatio: '3:2',
			imageSize: '2K',
			profilePrompt: [{ key: 'style', value: 'minimalist' }],
			userPromptNormalization: [{ key: 'mood', candidates: [{ value: 'organic' }] }],
		})
		mocks.normalizeImageProfilePrompt.mockResolvedValue({
			finalPrompt: { style: 'minimalist', mood: 'organic', subject: '파란 세럼병' },
			normalizedInput: { mood: 'organic' },
		})
		mocks.generateBrandImages.mockResolvedValue({
			images: ['data:image/png;base64,profile'],
			model: 'gpt-image-2',
			provider: 'openai',
		})
		const user = { id: 1 }

		await expect(
			generateImages({
				userInput: '파란 세럼병',
				profileId: 5,
				user,
				count: 2,
			}),
		).resolves.toEqual({
			images: ['data:image/png;base64,profile'],
			model: 'gpt-image-2',
			prompt: JSON.stringify({
				style: 'minimalist',
				mood: 'organic',
				subject: '파란 세럼병',
			}),
			profileId: 5,
			profileName: 'Technical Illustration',
			provider: 'openai',
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
			modelPreset: 'openai-gpt-image-2',
			aspectRatio: '3:2',
			imageSize: '2K',
		})
	})

	it('Nano Banana 프로파일은 Google 키와 16:9 계약을 사용한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
			profilePrompt: [{ key: 'style', value: 'technical' }],
			userPromptNormalization: [],
		})
		mocks.normalizeImageProfilePrompt.mockResolvedValue({
			finalPrompt: { style: 'technical', subject: '굴착기' },
			normalizedInput: {},
		})
		mocks.generateBrandImages.mockResolvedValue({
			images: ['data:image/png;base64,google'],
			model: 'gemini-3.1-flash-lite-image',
			provider: 'google',
		})

		await generateImages({
			userInput: '굴착기',
			profileId: 5,
			user: { id: 1 },
			count: 2,
		})

		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: JSON.stringify({ style: 'technical', subject: '굴착기' }),
			count: 2,
			modelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
		})
	})

	it('Admin 생성 테스트의 저장 전 모델과 크기를 사용한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'
		mocks.generateBrandImages.mockResolvedValue({
			images: ['data:image/png;base64,google'],
			model: 'gemini-3.1-flash-lite-image',
			provider: 'google',
		})

		await generateImagesWithSettings({
			userInput: 'technical excavator',
			count: 1,
			aspectRatio: '16:9',
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '1K',
		})

		expect(mocks.findPublishedImageProfile).not.toHaveBeenCalled()
		expect(mocks.generateBrandImages).toHaveBeenCalledWith({
			prompt: 'technical excavator',
			count: 1,
			modelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
		})
	})

	it('Nano Banana 2 Lite의 2K 출력을 호출 전에 거부한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'

		await expect(
			generateImagesWithSettings({
				userInput: 'technical excavator',
				count: 1,
				aspectRatio: '16:9',
				imageModelPreset: 'google-nano-banana-2-lite',
				imageSize: '2K',
			}),
		).rejects.toThrow('does not support 2K')
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('Google 키가 없는 Nano Banana 프로파일은 dev 폴백으로 보내지 않는다', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
			profilePrompt: [{ key: 'style', value: 'technical' }],
			userPromptNormalization: [],
		})
		mocks.normalizeImageProfilePrompt.mockResolvedValue({
			finalPrompt: { style: 'technical', subject: '굴착기' },
			normalizedInput: {},
		})

		await expect(
			generateImages({
				userInput: '굴착기',
				profileId: 5,
				user: { id: 1 },
				count: 1,
			}),
		).rejects.toBeInstanceOf(ImageGenerationUnavailableError)
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('published 프로파일이 없으면 생성기를 호출하지 않는다', async () => {
		mocks.env.OPENAI_API_KEY = 'key'

		await expect(
			generateImages({
				userInput: 'sample',
				profileId: 404,
				user: { id: 1 },
				count: 1,
			}),
		).rejects.toBeInstanceOf(ImageProfileNotFoundError)
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})
})
