import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	readCheckImage: vi.fn(),
	startCheckSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ isPayloadUser: () => true }))
vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/asset-check/services/start-check-session.service', () => ({
	startCheckSession: mocks.startCheckSession,
}))
vi.mock('@/app/api/check/read-check-image', () => ({
	readCheckImage: mocks.readCheckImage,
}))

import { POST } from './route'

describe('POST /api/check', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: { error: vi.fn() } },
			user: { id: 7 },
		})
		mocks.readCheckImage.mockResolvedValue({
			buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			name: 'image.png',
		})
		mocks.startCheckSession.mockResolvedValue({ results: {} })
	})

	it('클라이언트가 다른 source를 보내도 review-page로 고정한다', async () => {
		const values = new Map<string, FormDataEntryValue>([
			['image', 'image'],
			['source', 'mcp-call'],
		])
		const request = {
			formData: async () => ({ get: (key: string) => values.get(key) ?? null }),
		} as Request

		await POST(request)

		expect(mocks.startCheckSession).toHaveBeenCalledWith(
			expect.objectContaining({ source: 'review-page' }),
		)
	})
})
