import { createMcpApiKeyRecord } from '@/features/mcp-access/repositories/mcp-api-key.payload.repository'
import { isPayloadUser } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isPayloadUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const credential = await createMcpApiKeyRecord(user)
		payload.logger.info({ keyId: credential.id, userId: user.id }, 'mcp-api-key.issued')
		return Response.json(
			{
				...credential,
				endpoint: new URL('/api/mcp', request.url).toString(),
			},
			{ status: 201 },
		)
	} catch {
		payload.logger.error({ userId: user.id }, 'mcp-api-key.issue-failed')
		return Response.json({ message: 'MCP API key issuance failed.' }, { status: 500 })
	}
}
