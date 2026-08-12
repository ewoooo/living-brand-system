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
vi.mock('@/features/image-generation/services/generate-image.service', () => ({
	generateImages: mocks.generateImages,
	generateImagesWithSettings: mocks.generateImagesWithSettings,
}))

import { POST } from './route'

// route는 error.name으로 매핑하므로 실제 클래스 대신 이름만 맞춘 오류로 검증한다.
function namedError(name: string) {
	const error = new Error(name)
	error.name = name
	return error
}

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
		mocks.generateImages.mockResolvedValue({
			aspectRatio: '1:1',
			generatedImages: [
				{
					collection: 'generated-images',
					createdAt: '2026-07-31T03:00:00.000Z',
					id: 8,
					url: '/api/generated-images/file/generated.png',
				},
			],
			images: ['/api/generated-images/file/generated.png'],
			imageSize: '1K',
			model: 'gpt-image-2',
			prompt: 'sample',
			provider: 'openai',
		})
		mocks.generateImagesWithSettings.mockResolvedValue({
			aspectRatio: '16:9',
			images: ['data:image/png;base64,result'],
			imageSize: '1K',
			model: 'gemini-3.1-flash-lite-image',
			prompt: 'sample',
			provider: 'google',
		})
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

	it('Admin 템플릿의 프로파일 생성을 처리한다', async () => {
		const response = await POST(imageRequest({ prompt: '  sample  ', count: 1, profileId: 5 }))

		expect(response.status).toBe(200)
		expect(await response.json()).toMatchObject({
			generatedImages: [{ id: 8, url: '/api/generated-images/file/generated.png' }],
			images: ['/api/generated-images/file/generated.png'],
		})
		expect(mocks.generateImages).toHaveBeenCalledWith({
			userInput: 'sample',
			count: 1,
			profileId: 5,
			user: { id: 1, role: 'manager' },
		})
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})

	it('Admin 프로파일의 저장 전 설정으로 생성한다', async () => {
		const response = await POST(
			imageRequest({
				prompt: 'a'.repeat(2_500),
				count: 1,
				aspectRatio: '16:9',
				imageModelPreset: 'google-nano-banana-2-lite',
				imageSize: '1K',
			}),
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toMatchObject({
			images: ['data:image/png;base64,result'],
		})
		expect(mocks.generateImagesWithSettings).toHaveBeenCalledWith({
			userInput: 'a'.repeat(2_500),
			count: 1,
			aspectRatio: '16:9',
			imageModelPreset: 'google-nano-banana-2-lite',
			imageSize: '1K',
			user: { id: 1, role: 'manager' },
		})
		expect(mocks.generateImages).not.toHaveBeenCalled()
	})

	it('공통 생성 한도를 넘으면 재시도 시간을 포함한 429를 반환한다', async () => {
		mocks.generateImages.mockRejectedValue(
			Object.assign(namedError('ImageGenerationLimitError'), { retryAfterSeconds: 8 }),
		)

		const response = await POST(imageRequest({ prompt: 'sample', count: 1, profileId: 5 }))

		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe('8')
	})

	it('published 프로파일이 없으면 404를 반환한다', async () => {
		mocks.generateImages.mockRejectedValue(namedError('ImageProfileNotFoundError'))

		const response = await POST(imageRequest({ prompt: 'sample', count: 1, profileId: 404 }))

		expect(response.status).toBe(404)
	})

	it('지원하지 않는 출력 해상도 오류를 400으로 매핑한다', async () => {
		mocks.generateImages.mockRejectedValue(namedError('UnsupportedImageOutputSizeError'))

		const response = await POST(imageRequest({ prompt: 'sample', count: 1, profileId: 5 }))

		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ message: '지원하지 않는 출력 해상도입니다.' })
	})

	it('2500자를 넘는 프롬프트를 거부한다', async () => {
		const response = await POST(
			imageRequest({ prompt: 'a'.repeat(2_501), count: 1, profileId: 5 }),
		)

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
		{ prompt: 'sample' },
	])('부분 설정·지원하지 않는 설정·일반 프로파일 입력을 거부한다: %o', async (body) => {
		const response = await POST(imageRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.generateImages).not.toHaveBeenCalled()
		expect(mocks.generateImagesWithSettings).not.toHaveBeenCalled()
	})
})
