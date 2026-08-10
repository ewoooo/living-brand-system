import { describe, expect, it, vi } from 'vitest'
import { createMcpApiKeyRecord } from '../repositories/mcp-api-key.payload.repository'
import { issueMcpApiKey } from './issue-mcp-api-key.service'

vi.mock('../repositories/mcp-api-key.payload.repository', () => ({
	createMcpApiKeyRecord: vi.fn(),
}))

describe('issueMcpApiKey', () => {
	it('mcp-api-key repository의 createMcpApiKeyRecord에 위임한다', async () => {
		const user = { id: 1 } as never
		const credential = { apiKey: 'key', id: 1 }
		vi.mocked(createMcpApiKeyRecord).mockResolvedValue(credential)

		await expect(issueMcpApiKey(user)).resolves.toBe(credential)
		expect(createMcpApiKeyRecord).toHaveBeenCalledWith(user)
	})
})
