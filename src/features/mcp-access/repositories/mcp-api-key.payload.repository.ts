import { randomUUID } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'
import { type McpToolName, mcpToolNames } from '../mcp-tool-names'

/** 새 MCP 키를 발급해 레코드 저장을 소유하고 Payload Local API에 사용자 접근 제어를 적용한다. */
export async function createMcpApiKeyRecord(user: User): Promise<{ apiKey: string; id: number }> {
	const apiKey = randomUUID()
	const payload = await getPayload({ config })
	const record = await payload.create({
		collection: 'payload-mcp-api-keys',
		data: {
			apiKey,
			enableAPIKey: true,
			label: 'Frontend MCP key',
			user: user.id,
			// grant 키는 mcp-tool-names의 도구 목록에서 파생된다 — 도구 추가 시 자동으로 함께 켜진다.
			'payload-mcp-tool': Object.fromEntries(
				mcpToolNames.map((name) => [name, true]),
			) as Record<McpToolName, true>,
		},
		depth: 0,
		overrideAccess: false,
		user,
	})

	return { apiKey, id: record.id }
}
