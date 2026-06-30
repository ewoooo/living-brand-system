import type { UIMessage } from 'ai'

export interface AgentToolMarker {
	isPending: boolean
	text: string
}

export function getAgentToolMarkerText(message: UIMessage) {
	return getAgentToolMarker(message)?.text ?? null
}

export function getAgentToolMarker(message: UIMessage): AgentToolMarker | null {
	let hasToolPart = false
	let hasPendingToolPart = false
	let listCount = 0
	let readCount = 0
	let searchResultCount = 0

	for (const part of message.parts) {
		if (!part.type.startsWith('tool-')) {
			continue
		}

		const toolPart = part as AgentToolPart
		hasToolPart = true
		hasPendingToolPart ||= !['output-available', 'output-error'].includes(toolPart.state ?? '')

		if (
			toolPart.type === 'tool-listGuidelinePages' &&
			toolPart.state === 'output-available' &&
			Array.isArray(toolPart.output)
		) {
			listCount += toolPart.output.length
		}

		if (
			toolPart.type === 'tool-readGuidelineDocument' &&
			toolPart.state === 'output-available' &&
			toolPart.output
		) {
			readCount += 1
		}

		if (
			toolPart.type === 'tool-searchGuidelines' &&
			toolPart.state === 'output-available' &&
			Array.isArray(toolPart.output)
		) {
			searchResultCount += toolPart.output.length
		}
	}

	if (!hasToolPart) {
		return null
	}

	if (listCount > 0) {
		return {
			isPending: hasPendingToolPart,
			text: `가이드라인 섹션 ${listCount}개를 확인했습니다`,
		}
	}

	if (readCount > 0) {
		return {
			isPending: hasPendingToolPart,
			text: `가이드라인 문서 ${readCount}개를 읽었습니다`,
		}
	}

	if (searchResultCount > 0) {
		return {
			isPending: hasPendingToolPart,
			text: `가이드라인 결과 ${searchResultCount}개를 찾았습니다`,
		}
	}

	return {
		isPending: hasPendingToolPart,
		text: hasPendingToolPart ? '가이드라인을 찾고 있습니다' : '가이드라인 검색을 완료했습니다',
	}
}

type AgentToolPart = UIMessage['parts'][number] & {
	output?: unknown
	state?: string
	type: string
}
