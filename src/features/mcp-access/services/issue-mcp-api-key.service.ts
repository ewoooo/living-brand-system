import { randomUUID } from 'node:crypto'
import { createMcpApiKeyRecord } from '@/features/mcp-access/repositories/mcp-api-key.payload.repository'
import type { User } from '@/payload-types'

/** 로그인 사용자의 MCP 키 한 개 발급만 조정하며, 저장 I/O는 Payload repository가 맡는다. */
export async function issueMcpApiKey(user: User): Promise<{ apiKey: string; id: number }> {
	const apiKey = randomUUID()
	const id = await createMcpApiKeyRecord(user, apiKey)

	return { apiKey, id }
}
