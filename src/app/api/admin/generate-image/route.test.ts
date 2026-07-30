import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	generateImages: vi.fn(),
	generateImagesWithSettings: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	logger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/generate-image/services/generate-image.service', () => {
	class ImageGenerationUnavailableError extends Error {}
	return {
		generateImages: mocks.generateImages,
		generateImagesWithSettings: mocks.generateImagesWithSettings,
		ImageGenerationUnavailableError,
	}
})

import { POST } from './route'

function imageRequest(body: unknown) {
	return new Request('http://localhost/api/admin/generate-image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

describe('POST /api/admin/generate-image', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 1, role: 'manager' },
		})
		const result = {
			images: ['data:image/png;base64,result'],
			model: 'gpt-image-2',
			prompt: 'sample',
			provider: 'openai',
		}
		mocks.generateImages.mockResolvedValue(result)
		mocks.generateImagesWithSettings.mockResolvedValue(result)
	})

	it('worker 요청을 거부한다', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 1, role: 'worker' },
		})

		const response = await POST(imageRequest({ prompt: 'sample', count: 1 }))

		expect(response.status).toBe(403)
		expect(mocks.generateImages).not.toHaveBeenCalled()
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})

	it('Admin 템플릿의 기본 생성을 처리한다', async () => {
		const response = await POST(imageRequest({ prompt: '  sample  ', count: 1 }))

		expect(response.status).toBe(200)
		expect(mocks.generateImages).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 1,
		})
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})

	it('Admin 프로파일의 저장 전 설정으로 생성한다', async () => {
		const response = await POST(
			imageRequest({
				prompt: 'a'.repeat(1_000),
				count: 1,
				aspectRatio: '16:9',
				imageModelPreset: 'google-nano-banana-2-lite',
				imageSize: '1K',
			}),
		)

		expect(response.status).toBe(200)
		expect(mocks.generateImagesWithSettings).toHaveBeenCalledWith({
			userInput: 'a'.repeat(1_000),
			count: 1,
			aspectRatio: '16:9',
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '1K',
		})
		expect(mocks.generateImages).not.toHaveBeenCalled()
	})

	it('1000자를 넘는 프롬프트를 거부한다', async () => {
		const response = await POST(imageRequest({ prompt: 'a'.repeat(1_001), count: 1 }))

		expect(response.status).toBe(400)
		expect(mocks.generateImages).not.toHaveBeenCalled()
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})

	it.each([
		{ prompt: 'sample', imageModelPreset: 'openai-gpt-image-2' },
		{
			prompt: 'sample',
			aspectRatio: '16:9',
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '2K',
		},
		{ prompt: 'sample', profileId: 5 },
	])('부분 설정·지원하지 않는 설정·일반 프로파일 입력을 거부한다: %o', async (body) => {
		const response = await POST(imageRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.generateImages).not.toHaveBeenCalled()
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})
})
