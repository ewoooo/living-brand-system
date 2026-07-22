import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	generateImageCandidates: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	logger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/env', () => ({ env: { OPENAI_API_KEY: 'key' } }))
vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/image-generation/services/generate-image.service', () => {
	class ImageGenerationUnavailableError extends Error {}
	class ImageProfileNotFoundError extends Error {}
	class ImagePromptNormalizationUnavailableError extends Error {}
	return {
		generateImageCandidates: mocks.generateImageCandidates,
		ImageGenerationUnavailableError,
		ImageProfileNotFoundError,
		ImagePromptNormalizationUnavailableError,
	}
})

import {
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	ImagePromptNormalizationUnavailableError,
} from '@/features/image-generation/services/generate-image.service'
import { POST } from './route'

function imageRequest(body: unknown) {
	return new Request('http://localhost/api/image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

describe('POST /api/image', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 1 },
		})
		mocks.generateImageCandidates.mockResolvedValue({
			images: ['data:image/png;base64,result'],
			prompt: 'sample',
		})
	})

	it('requires authentication regardless of provider configuration', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: null,
		})

		const response = await POST(imageRequest({ prompt: 'sample' }))

		expect(response.status).toBe(401)
		expect(mocks.generateImageCandidates).not.toHaveBeenCalled()
	})

	it.each([
		{ prompt: '', count: 1 },
		{ prompt: 'sample', count: 0 },
		{ prompt: 'sample', count: 1.5 },
		{ prompt: 'sample', profileId: 0 },
	])('rejects invalid generation input: %o', async (body) => {
		const response = await POST(imageRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.generateImageCandidates).not.toHaveBeenCalled()
	})

	it.each([
		new ImageGenerationUnavailableError(),
		new ImagePromptNormalizationUnavailableError(),
	])('생성기나 정규화 모델을 사용할 수 없으면 503을 반환한다', async (error) => {
		mocks.generateImageCandidates.mockRejectedValue(error)

		const response = await POST(imageRequest({ prompt: 'sample' }))

		expect(response.status).toBe(503)
	})

	it('passes normalized valid input to the service', async () => {
		const response = await POST(imageRequest({ prompt: '  sample  ' }))

		expect(response.status).toBe(200)
		expect(mocks.generateImageCandidates).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 4,
			profileId: undefined,
			user: { id: 1 },
		})
	})

	it('profileId를 사용자와 함께 서비스에 전달한다', async () => {
		const response = await POST(imageRequest({ prompt: 'sample', profileId: 5, count: 1 }))

		expect(response.status).toBe(200)
		expect(mocks.generateImageCandidates).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 1,
			profileId: 5,
			user: { id: 1 },
		})
	})

	it('published 프로파일이 없으면 404를 반환한다', async () => {
		mocks.generateImageCandidates.mockRejectedValue(new ImageProfileNotFoundError())

		const response = await POST(imageRequest({ prompt: 'sample', profileId: 404 }))

		expect(response.status).toBe(404)
	})
})
