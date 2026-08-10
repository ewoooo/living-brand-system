/**
 * MCP 키 발급 브라우저 fetch — POST /api/mcp-key 호출과 401 판별을 소유한다.
 * 실제 키 발급·저장은 서버측 issue-mcp-api-key.service가 담당하고,
 * 화면 상태(로딩·에러 표시)와 미인증 시 리다이렉트는 호출자(useMcpKeyIssuance)가 담당한다.
 */

export interface McpApiKeyCredential {
	apiKey: string
	endpoint: string
	id: number
}

export type RequestMcpApiKeyResult =
	| { status: 'issued'; credential: McpApiKeyCredential }
	| { status: 'unauthorized' }
	| { status: 'error' }

/** 로그인한 사용자를 위한 MCP 키 발급을 요청한다. */
export async function requestMcpApiKey(): Promise<RequestMcpApiKeyResult> {
	const response = await fetch('/api/mcp-key', { method: 'POST' }).catch(() => null)

	if (response?.status === 401) return { status: 'unauthorized' }
	if (!response?.ok) return { status: 'error' }

	return { status: 'issued', credential: (await response.json()) as McpApiKeyCredential }
}
