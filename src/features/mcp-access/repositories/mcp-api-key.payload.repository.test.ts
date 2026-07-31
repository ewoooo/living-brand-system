import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { createMcpApiKeyRecord } from './mcp-api-key.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('MCP API key repository', () => {
	it('새 키에 사용자용 MCP 도구를 모두 활성화한다', async () => {
		const create = vi.fn().mockResolvedValue({ id: 7 })
		vi.mocked(getPayload).mockResolvedValue({ create } as never)
		const user = { email: 'worker@example.com', id: 1, role: 'worker' } as const

		await expect(createMcpApiKeyRecord(user as never, 'one-time-key')).resolves.toBe(7)
		expect(create).toHaveBeenCalledWith({
			collection: 'payload-mcp-api-keys',
			data: {
				apiKey: 'one-time-key',
				enableAPIKey: true,
				label: 'Frontend MCP key',
				user: 1,
				'payload-mcp-tool': {
					findChecks: true,
					findGuideline: true,
					findGuidelineDocuments: true,
					findTemplates: true,
					generateBrandImage: true,
					listImageProfiles: true,
					runAssetCheck: true,
					searchGuidelines: true,
					submitAssetCheckObservations: true,
				},
			},
			depth: 0,
			overrideAccess: false,
			user,
		})
	})
})
