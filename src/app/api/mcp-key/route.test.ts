import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	isCrossOriginRequest: vi.fn(),
	issueMcpApiKey: vi.fn(),
	logger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: mocks.authenticateRequest,
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/mcp-access/services/issue-mcp-api-key.service', () => ({
	issueMcpApiKey: mocks.issueMcpApiKey,
}))

import { POST } from './route'

describe('POST /api/mcp-key', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: { email: 'worker@example.com', id: 1, role: 'worker' },
		})
		mocks.issueMcpApiKey.mockResolvedValue({ apiKey: 'one-time-key', id: 7 })
	})

	it('로그인 사용자에게 외부 연결 정보를 한 번 반환한다', async () => {
		const response = await POST(
			new Request('https://lbs.example/api/mcp-key', { method: 'POST' }),
		)

		expect(response.status).toBe(201)
		expect(await response.json()).toEqual({
			apiKey: 'one-time-key',
			endpoint: 'https://lbs.example/api/mcp',
			id: 7,
		})
		expect(mocks.issueMcpApiKey).toHaveBeenCalledWith({
			email: 'worker@example.com',
			id: 1,
			role: 'worker',
		})
	})

	it('로그인하지 않은 요청은 발급하지 않는다', async () => {
		mocks.authenticateRequest.mockResolvedValue({
			payload: { logger: mocks.logger },
			user: null,
		})

		const response = await POST(
			new Request('https://lbs.example/api/mcp-key', { method: 'POST' }),
		)

		expect(response.status).toBe(401)
		expect(mocks.issueMcpApiKey).not.toHaveBeenCalled()
	})
})
