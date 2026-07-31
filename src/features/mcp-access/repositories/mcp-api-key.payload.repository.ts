import config from '@payload-config'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

/** MCP 키 레코드 저장을 소유하고 Payload Local API에 사용자 접근 제어를 적용한다. */
export async function createMcpApiKeyRecord(user: User, apiKey: string): Promise<number> {
	const payload = await getPayload({ config })
	const record = await payload.create({
		collection: 'payload-mcp-api-keys',
		data: {
			apiKey,
			enableAPIKey: true,
			label: 'Frontend MCP key',
			user: user.id,
			'payload-mcp-tool': {
				findTemplates: true,
				findChecks: true,
				findGuideline: true,
				findGuidelineDocuments: true,
				generateBrandImage: true,
				listImageProfiles: true,
				runAssetCheck: true,
				searchGuidelines: true,
			},
		},
		depth: 0,
		overrideAccess: false,
		user,
	})

	return record.id
}
