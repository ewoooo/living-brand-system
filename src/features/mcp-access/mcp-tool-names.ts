// MCP 도구 이름의 단일 원본 — 도구 정의(mcp-tools)와 키 발급 grant(repository)가 같은 집합을 공유한다.
// payload import가 없는 leaf 모듈이어야 한다(repository ↔ payload.config 순환 방지).
export const mcpToolNames = [
	'findGuidelineDocuments',
	'findChecks',
	'findGuideline',
	'searchGuidelines',
	'findTemplates',
	'listImageProfiles',
	'runAssetCheck',
	'submitAssetCheckObservations',
	'generateBrandImage',
] as const

export type McpToolName = (typeof mcpToolNames)[number]
