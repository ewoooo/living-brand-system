import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	CheckSessionInputMismatchError,
	CheckSessionNotFoundError,
	CheckSessionTerminalError,
} from '@/features/asset-check/domain/check-session'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	completeCheckSessionAiCheck: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	logger: { error: vi.fn() },
	readCheckImage: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ isPayloadUser: () => true }))
vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/services/start-check-session.service', () => ({
	completeCheckSessionAiCheck: mocks.completeCheckSessionAiCheck,
}))
vi.mock('@/app/api/check/read-check-image', () => ({
	readCheckImage: mocks.readCheckImage,
}))

import { POST } from './route'

function request() {
	const values = new Map<string, FormDataEntryValue>([
		['checkSessionId', '41'],
		['image', 'image'],
	])
	return {
		formData: async () => ({ get: (key: string) => values.get(key) ?? null }),
	} as Request
}

describe('POST /api/check/ai', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { id: 7 },
		})
		mocks.readCheckImage.mockResolvedValue({
			buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			name: 'image.png',
		})
	})

	it.each([
		[new CheckSessionNotFoundError(), 404, 'Check session not found.'],
		[new CheckSessionInputMismatchError(), 409, 'Image does not match check session.'],
		[new CheckSessionTerminalError(), 409, 'Check session already finished.'],
	])('%s를 HTTP %i로 변환한다', async (error, status, message) => {
		mocks.completeCheckSessionAiCheck.mockRejectedValue(error)

		const response = await POST(request())

		expect(response.status).toBe(status)
		await expect(response.json()).resolves.toEqual({ message })
		expect(mocks.logger.error).not.toHaveBeenCalled()
	})
})
