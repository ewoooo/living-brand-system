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
	loadGeneratedImage: vi.fn(),
	normalizeImageProfilePrompt: vi.fn(),
	storeGeneratedImages: vi.fn(),
}))

const ONE_PIXEL_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

vi.mock('@/env', () => ({ env: mocks.env }))
vi.mock('@/features/generate-image/repositories/dev-image-generation.rest.repository', () => ({
	devGenerateImages: mocks.devGenerateImages,
}))
vi.mock(
	'@/features/generate-image/repositories/image-generation.ai.repository',
	async (importOriginal) => ({
		// 프리셋 표의 실제 API 키 조회(getImageModelApiKey)는 그대로 두고 모델 호출만 대체한다.
		...(await importOriginal<
			typeof import('@/features/generate-image/repositories/image-generation.ai.repository')
		>()),
		generateBrandImages: mocks.generateBrandImages,
	}),
)
vi.mock('@/features/generate-image/repositories/image-profile.payload.repository', () => ({
	findPublishedImageProfile: mocks.findPublishedImageProfile,
}))
vi.mock('@/features/generate-image/repositories/generated-image.payload.repository', () => ({
	loadGeneratedImage: mocks.loadGeneratedImage,
	storeGeneratedImages: mocks.storeGeneratedImages,
}))
vi.mock('@/features/generate-image/services/normalize-image-profile-prompt.service', () => ({
	ImageGenerationUnavailableError: class extends Error {},
	normalizeImageProfilePrompt: mocks.normalizeImageProfilePrompt,
}))

import {
	adjustImageCamera,
	generateImages,
	generateImagesWithSettings,
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	InvalidSeedImageError,
	planImageGenerationFromProfile,
	planImageGenerationFromSettings,
	UnsupportedImageOutputSizeError,
} from './generate-image.service'

describe('generateImages', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.env.NODE_ENV = 'test'
		mocks.env.IMAGE_DEV_FALLBACK = undefined
		mocks.env.GEMINI_API_KEY = undefined
		mocks.env.OPENAI_API_KEY = undefined
		mocks.findPublishedImageProfile.mockResolvedValue(null)
		mocks.loadGeneratedImage.mockResolvedValue(null)
		mocks.storeGeneratedImages.mockResolvedValue([
			{
				collection: 'generated-images',
				createdAt: '2026-07-31T03:00:00.000Z',
				id: 8,
				url: '/api/generated-images/file/generated.png',
			},
		])
	})

	it('fails closed when no image provider is configured', async () => {
		mocks.env.NODE_ENV = 'production'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'

		await expect(
			generateImagesWithSettings({
				userInput: 'sample',
				count: 1,
				aspectRatio: '1:1',
				imageModelPreset: 'openai-gpt-image-2',
				imageSize: '1K',
			}),
		).rejects.toBeInstanceOf(ImageGenerationUnavailableError)
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('uses Pollinations only when development explicitly enables it', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.devGenerateImages.mockResolvedValue(['data:image/jpeg;base64,dev'])

		const result = await generateImagesWithSettings({
			userInput: 'sample',
			count: 2,
			aspectRatio: '1:1',
			imageModelPreset: 'openai-gpt-image-2',
			imageSize: '1K',
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

		await generateImagesWithSettings({
			userInput: 'sample',
			count: 1,
			aspectRatio: '1:1',
			imageModelPreset: 'openai-gpt-image-2',
			imageSize: '1K',
		})

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
			aspectRatio: '3:2',
			generatedImages: [
				{
					collection: 'generated-images',
					createdAt: '2026-07-31T03:00:00.000Z',
					id: 8,
					url: '/api/generated-images/file/generated.png',
				},
			],
			images: ['/api/generated-images/file/generated.png'],
			imageSize: '2K',
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
		expect(mocks.storeGeneratedImages).toHaveBeenCalledWith({
			createdBy: 1,
			effectivePrompt: JSON.stringify({
				style: 'minimalist',
				mood: 'organic',
				subject: '파란 세럼병',
			}),
			images: ['data:image/png;base64,profile'],
			inputPrompt: '파란 세럼병',
			model: 'gpt-image-2',
			profile: expect.objectContaining({
				aspectRatio: '3:2',
				id: 5,
				imageSize: '2K',
				name: 'Technical Illustration',
			}),
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

	it('Nano Banana 2 Lite의 2K 출력을 호출 전에 타입 있는 오류로 거부한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'

		const generation = generateImagesWithSettings({
			userInput: 'technical excavator',
			count: 1,
			aspectRatio: '16:9',
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '2K',
		})
		await expect(generation).rejects.toBeInstanceOf(UnsupportedImageOutputSizeError)
		await expect(generation).rejects.toThrow('does not support 2K')
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

	it('시드 이미지와 해석된 카메라 프롬프트로 시점을 조정한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'
		mocks.loadGeneratedImage.mockResolvedValue(
			Buffer.from(ONE_PIXEL_PNG.split(',')[1] ?? '', 'base64'),
		)
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
		})
		mocks.generateBrandImages.mockResolvedValue({
			images: ['data:image/png;base64,adjusted'],
			model: 'gemini-3.1-flash-lite-image',
			provider: 'google',
		})

		const result = await adjustImageCamera({
			basePrompt: JSON.stringify({
				composition: 'ISO-metric view',
				subject: '유조선',
			}),
			camera: { azimuthDeg: 45, elevationDeg: 20 },
			count: 1,
			generatedImageId: 8,
			profileId: 5,
			requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
			user: { id: 1 },
		})

		expect(result.camera).toEqual({
			input: { azimuthDeg: 45, elevationDeg: 20 },
			resolved: { azimuth: 'front-right', elevation: 'elevated' },
		})
		const generationInput = mocks.generateBrandImages.mock.calls[0]?.[0]
		expect(JSON.parse(generationInput.prompt)).toMatchObject({
			camera: 'front-right three-quarter view, slightly elevated camera angle',
			subject: '유조선',
		})
		expect([...generationInput.seedImage].slice(0, 8)).toEqual([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		])
		expect(mocks.loadGeneratedImage).toHaveBeenCalledWith({
			generatedImageId: 8,
			profileId: 5,
			requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
			user: { id: 1 },
		})
	})

	it('조회할 수 없는 생성 이미지 ID를 거부한다', async () => {
		mocks.env.GEMINI_API_KEY = 'key'
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
		})

		await expect(
			adjustImageCamera({
				basePrompt: '{"subject":"유조선"}',
				camera: { azimuthDeg: 0, elevationDeg: 0 },
				count: 1,
				generatedImageId: 404,
				profileId: 5,
				requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
				user: { id: 1 },
			}),
		).rejects.toBeInstanceOf(InvalidSeedImageError)
		expect(mocks.generateBrandImages).not.toHaveBeenCalled()
	})

	it('시드 이미지 편집은 Pollinations 개발 폴백을 사용하지 않는다', async () => {
		mocks.env.NODE_ENV = 'development'
		mocks.env.IMAGE_DEV_FALLBACK = 'true'
		mocks.loadGeneratedImage.mockResolvedValue(
			Buffer.from(ONE_PIXEL_PNG.split(',')[1] ?? '', 'base64'),
		)
		mocks.findPublishedImageProfile.mockResolvedValue({
			id: 5,
			name: 'Technical Illustration',
			imageModelPreset: 'openai-gpt-image-2',
			aspectRatio: '1:1',
			imageSize: '1K',
		})

		await expect(
			adjustImageCamera({
				basePrompt: '{"subject":"유조선"}',
				camera: { azimuthDeg: 0, elevationDeg: 0 },
				count: 1,
				generatedImageId: 8,
				profileId: 5,
				requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
				user: { id: 1 },
			}),
		).rejects.toBeInstanceOf(ImageGenerationUnavailableError)
		expect(mocks.devGenerateImages).not.toHaveBeenCalled()
	})
})

describe('image generation plan resolvers', () => {
	it('published 프로파일의 모델·출력 계약을 생성 플랜으로 해석한다', () => {
		const seedImage = new Uint8Array([137, 80, 78, 71])

		expect(
			planImageGenerationFromProfile(
				{
					aspectRatio: '16:9',
					id: 5,
					imageModelPreset: 'google-nano-banana-2-lite',
					imageSize: '1K',
					name: 'Technical Illustration',
				},
				{ prompt: '{"subject":"굴착기"}', count: 2, seedImage },
			),
		).toEqual({
			prompt: '{"subject":"굴착기"}',
			count: 2,
			modelPreset: 'google-nano-banana-2-lite',
			aspectRatio: '16:9',
			imageSize: '1K',
			profileId: 5,
			profileName: 'Technical Illustration',
			seedImage,
		})
	})

	it('명시 설정은 프롬프트를 trim해 프로파일 없는 플랜으로 해석한다', () => {
		expect(
			planImageGenerationFromSettings({
				userInput: '  technical excavator  ',
				count: 1,
				imageModelPreset: 'openai-gpt-image-2',
				aspectRatio: '1:1',
				imageSize: '2K',
			}),
		).toEqual({
			prompt: 'technical excavator',
			count: 1,
			modelPreset: 'openai-gpt-image-2',
			aspectRatio: '1:1',
			imageSize: '2K',
		})
	})
})
