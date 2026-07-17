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
	return {
		generateImageCandidates: mocks.generateImageCandidates,
		ImageGenerationUnavailableError,
	}
})

import { ImageGenerationUnavailableError } from '@/features/image-generation/services/generate-image.service'
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
			sceneId: 'free',
		})
	})

	it('requires authentication regardless of provider configuration', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: null,
		})

		const response = await POST(imageRequest({ prompt: 'sample', sceneId: 'free' }))

		expect(response.status).toBe(401)
		expect(mocks.generateImageCandidates).not.toHaveBeenCalled()
	})

	it.each([
		{ prompt: '', count: 1 },
		{ prompt: 'sample', count: 0 },
		{ prompt: 'sample', count: 1.5 },
		{ prompt: 'sample', sceneId: 'unknown' },
	])('rejects invalid generation input: %o', async (body) => {
		const response = await POST(imageRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.generateImageCandidates).not.toHaveBeenCalled()
	})

	it('returns 503 when the server has no enabled image provider', async () => {
		mocks.generateImageCandidates.mockRejectedValue(new ImageGenerationUnavailableError())

		const response = await POST(imageRequest({ prompt: 'sample', sceneId: 'free' }))

		expect(response.status).toBe(503)
	})

	it('passes normalized valid input to the service', async () => {
		const response = await POST(imageRequest({ prompt: '  sample  ', sceneId: 'free' }))

		expect(response.status).toBe(200)
		expect(mocks.generateImageCandidates).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 4,
			sceneId: 'free',
		})
	})
})
