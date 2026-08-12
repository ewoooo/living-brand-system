import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES } from '@/features/image-generation/camera-control'

const mocks = vi.hoisted(() => ({
	adjustImageCamera: vi.fn(),
	authenticateRequest: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	logger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/image-generation/services/generate-image.service', () => ({
	adjustImageCamera: mocks.adjustImageCamera,
}))

import { POST } from './route'

// route는 error.name으로 매핑하므로 실제 클래스 대신 이름만 맞춘 오류로 검증한다.
function namedError(name: string) {
	const error = new Error(name)
	error.name = name
	return error
}

const validBody = {
	basePrompt: '{"style":"technical illustration","subject":"유조선"}',
	camera: { azimuthDeg: 45, elevationDeg: 20 },
	count: 1,
	generatedImageId: 8,
	profileId: 5,
}

function cameraRequest(body: unknown, headers?: Record<string, string>) {
	return new Request('http://localhost/api/generate-image/camera-adjustment', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(body),
	})
}

describe('POST /api/generate-image/camera-adjustment', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 1 },
		})
		mocks.adjustImageCamera.mockResolvedValue({
			camera: {
				input: validBody.camera,
				resolved: { azimuth: 'front-right', elevation: 'elevated' },
			},
			aspectRatio: '16:9',
			generatedImages: [
				{
					collection: 'generated-images',
					createdAt: '2026-07-31T03:00:00.000Z',
					id: 9,
					url: '/api/generated-images/file/adjusted.png',
				},
			],
			images: ['/api/generated-images/file/adjusted.png'],
			imageSize: '1K',
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"camera":"front-right three-quarter view"}',
			provider: 'google',
		})
	})

	it('인증되지 않은 요청을 거부한다', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: null,
		})

		const response = await POST(cameraRequest(validBody))

		expect(response.status).toBe(401)
		expect(mocks.adjustImageCamera).not.toHaveBeenCalled()
	})

	it.each([
		{ ...validBody, basePrompt: 'not json' },
		{ ...validBody, camera: { azimuthDeg: 181, elevationDeg: 0 } },
		{ ...validBody, camera: { azimuthDeg: 0, elevationDeg: 91 } },
		{ ...validBody, generatedImageId: 0 },
		{ ...validBody, profileId: 0 },
		{ ...validBody, count: 0 },
	])('계약 밖의 입력을 거부한다: %o', async (body) => {
		const response = await POST(cameraRequest(body))

		expect(response.status).toBe(400)
		expect(mocks.adjustImageCamera).not.toHaveBeenCalled()
	})

	it('요청 크기 제한을 초과하면 본문을 처리하지 않는다', async () => {
		const response = await POST(
			cameraRequest(validBody, {
				'Content-Length': String(MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES + 1),
			}),
		)

		expect(response.status).toBe(413)
		expect(mocks.adjustImageCamera).not.toHaveBeenCalled()
	})

	it('카메라 입력과 생성 이미지 ID를 서비스에 전달한다', async () => {
		const response = await POST(cameraRequest(validBody))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			camera: {
				input: validBody.camera,
				resolved: { azimuth: 'front-right', elevation: 'elevated' },
			},
			aspectRatio: '16:9',
			generatedImages: [
				{
					collection: 'generated-images',
					createdAt: '2026-07-31T03:00:00.000Z',
					id: 9,
					url: '/api/generated-images/file/adjusted.png',
				},
			],
			images: ['/api/generated-images/file/adjusted.png'],
			imageSize: '1K',
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"camera":"front-right three-quarter view"}',
		})
		expect(mocks.adjustImageCamera).toHaveBeenCalledWith({
			...validBody,
			requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
			user: { id: 1 },
		})
	})

	it.each([
		[namedError('ImageGenerationLimitError'), 429],
		[namedError('ImageGenerationUnavailableError'), 503],
		[namedError('ImageProfileNotFoundError'), 404],
		[namedError('InvalidImageControllerInputError'), 400],
		[namedError('InvalidSeedImageError'), 400],
		[namedError('UnsupportedImageOutputSizeError'), 400],
	] as const)('서비스 오류를 안전한 상태 코드로 변환한다', async (error, status) => {
		mocks.adjustImageCamera.mockRejectedValue(error)

		const response = await POST(cameraRequest(validBody))

		expect(response.status).toBe(status)
	})
})
