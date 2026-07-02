/**
 * Figma 디자인 URL에서 fileKey와 nodeId를 뽑는다.
 * Route Handler가 Service Input을 만들 때 쓰는 입력 정규화 함수로, I/O가 없다.
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
	let parsed: URL

	try {
		parsed = new URL(url)
	} catch {
		return null
	}

	if (!parsed.hostname.endsWith('figma.com')) {
		return null
	}

	const match = parsed.pathname.match(/^\/(?:design|file)\/([a-zA-Z0-9]+)(?:\/|$)/)
	const rawNodeId = parsed.searchParams.get('node-id')

	if (!match || !rawNodeId) {
		return null
	}

	// URL의 node-id는 "123-456", API는 "123:456" 형식을 쓴다.
	return { fileKey: match[1], nodeId: rawNodeId.replace(/-/g, ':') }
}
