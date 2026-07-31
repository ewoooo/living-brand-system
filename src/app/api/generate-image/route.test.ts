import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	generateImages: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	logger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/generate-image/services/generate-image.service', () => {
	class ImageGenerationUnavailableError extends Error {}
	class ImageProfileNotFoundError extends Error {}
	class ImagePromptNormalizationUnavailableError extends Error {}
	return {
		generateImages: mocks.generateImages,
		ImageGenerationUnavailableError,
		ImageProfileNotFoundError,
		ImagePromptNormalizationUnavailableError,
	}
})

import {
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	ImagePromptNormalizationUnavailableError,
} from '@/features/generate-image/services/generate-image.service'
import { POST } from './route'

function imageRequest(body: unknown) {
	return new Request('http://localhost/api/generate-image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

describe('POST /api/generate-image', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 1 },
		})
		mocks.generateImages.mockResolvedValue({
			images: ['data:image/png;base64,result'],
			model: 'gpt-image-2',
			prompt: 'sample',
			provider: 'openai',
		})
	})

	it('인증되지 않은 요청을 거부한다', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: null,
		})

		const response = await POST(imageRequest({ prompt: 'sample' }))

		expect(response.status).toBe(401)
		expect(mocks.generateImages).not.toHaveBeenCalled()
	})

	it.each([
		{ prompt: '', count: 1 },
		{ prompt: 'sample', count: 0 },
		{ prompt: 'sample', count: 1.5 },
		{ prompt: 'sample' },
		{ prompt: 'sample', profileId: 0 },
		{ prompt: 'sample', imageModelPreset: 'openai-gpt-image-2' },
	])('일반 생성 계약 밖의 입력을 거부한다: %o', async (body) => {
		const response = await POST(imageRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.generateImages).not.toHaveBeenCalled()
	})

	it.each([
		new ImageGenerationUnavailableError(),
		new ImagePromptNormalizationUnavailableError(),
	])('생성기나 정규화 모델을 사용할 수 없으면 503을 반환한다', async (error) => {
		mocks.generateImages.mockRejectedValue(error)

		const response = await POST(imageRequest({ prompt: 'sample', profileId: 5 }))

		expect(response.status).toBe(503)
	})

	it('유효한 입력과 사용자를 서비스에 전달하고 실제 모델을 반환한다', async () => {
		const response = await POST(imageRequest({ prompt: '  sample  ', profileId: 5, count: 1 }))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			images: ['data:image/png;base64,result'],
			model: 'gpt-image-2',
			prompt: 'sample',
		})
		expect(mocks.generateImages).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 1,
			profileId: 5,
			user: { id: 1 },
		})
	})

	it('published 프로파일이 없으면 404를 반환한다', async () => {
		mocks.generateImages.mockRejectedValue(new ImageProfileNotFoundError())

		const response = await POST(imageRequest({ prompt: 'sample', profileId: 404 }))

		expect(response.status).toBe(404)
	})
})
