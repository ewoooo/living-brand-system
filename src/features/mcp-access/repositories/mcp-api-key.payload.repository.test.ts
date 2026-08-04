import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { createMcpApiKeyRecord } from './mcp-api-key.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('MCP API key repository', () => {
	it('새 키를 발급하고 사용자용 MCP 도구를 모두 활성화한다', async () => {
		const create = vi.fn().mockResolvedValue({ id: 7 })
		vi.mocked(getPayload).mockResolvedValue({ create } as never)
		const user = { email: 'worker@example.com', id: 1, role: 'worker' } as const

		const credential = await createMcpApiKeyRecord(user as never)
		expect(credential).toEqual({ apiKey: expect.stringMatching(/^[0-9a-f-]{36}$/), id: 7 })
		expect(create).toHaveBeenCalledWith({
			collection: 'payload-mcp-api-keys',
			data: {
				apiKey: credential.apiKey,
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
