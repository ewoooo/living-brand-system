import type { User } from '@/payload-types'
import { createMcpApiKeyRecord } from '../repositories/mcp-api-key.payload.repository'

/**
 * mcp-key route가 신규 MCP API 키를 발급하는 use case.
 * Payload 저장은 mcp-api-key repository가 소유한다.
 */
export async function issueMcpApiKey(user: User): Promise<{ apiKey: string; id: number }> {
	return createMcpApiKeyRecord(user)
}
