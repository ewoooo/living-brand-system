import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES } from '@/features/generate-image/camera-control'

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
vi.mock('@/features/generate-image/services/generate-image.service', () => {
	class ImageGenerationUnavailableError extends Error {}
	class ImageProfileNotFoundError extends Error {}
	class InvalidSeedImageError extends Error {}
	return {
		adjustImageCamera: mocks.adjustImageCamera,
		ImageGenerationUnavailableError,
		ImageProfileNotFoundError,
		InvalidSeedImageError,
	}
})

import {
	ImageGenerationUnavailableError,
	ImageProfileNotFoundError,
	InvalidSeedImageError,
} from '@/features/generate-image/services/generate-image.service'
import { POST } from './route'

const validBody = {
	basePrompt: '{"style":"technical illustration","subject":"유조선"}',
	camera: { azimuthDeg: 45, elevationDeg: 20 },
	count: 1,
	profileId: 5,
	seedImage: 'data:image/png;base64,iVBORw0KGgo=',
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
			images: ['data:image/png;base64,result'],
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
		{ ...validBody, profileId: 0 },
		{ ...validBody, seedImage: 'data:image/svg+xml;base64,PHN2Zz4=' },
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

	it('카메라 입력과 시드 이미지를 서비스에 전달한다', async () => {
		const response = await POST(cameraRequest(validBody))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({
			camera: {
				input: validBody.camera,
				resolved: { azimuth: 'front-right', elevation: 'elevated' },
			},
			images: ['data:image/png;base64,result'],
			model: 'gemini-3.1-flash-lite-image',
			profileId: 5,
			profileName: 'Technical Illustration',
			prompt: '{"camera":"front-right three-quarter view"}',
		})
		expect(mocks.adjustImageCamera).toHaveBeenCalledWith({
			...validBody,
			user: { id: 1 },
		})
	})

	it.each([
		[new ImageGenerationUnavailableError(), 503],
		[new ImageProfileNotFoundError(), 404],
		[new InvalidSeedImageError(), 400],
	] as const)('서비스 오류를 안전한 상태 코드로 변환한다', async (error, status) => {
		mocks.adjustImageCamera.mockRejectedValue(error)

		const response = await POST(cameraRequest(validBody))

		expect(response.status).toBe(status)
	})
})
