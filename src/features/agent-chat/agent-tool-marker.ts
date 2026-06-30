import type { UIMessage } from 'ai'

export function getAgentToolMarkerText(message: UIMessage) {
	let hasToolPart = false
	let listCount = 0
	let readCount = 0
	let searchResultCount = 0

	for (const part of message.parts) {
		if (!part.type.startsWith('tool-')) {
			continue
		}

		const toolPart = part as AgentToolPart
		hasToolPart = true

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
		return `Listed ${listCount} guideline ${listCount === 1 ? 'section' : 'sections'}`
	}

	if (readCount > 0) {
		return `Read ${readCount} guideline ${readCount === 1 ? 'document' : 'documents'}`
	}

	if (searchResultCount > 0) {
		return `Explored ${searchResultCount} guideline ${
			searchResultCount === 1 ? 'record' : 'records'
		}`
	}

	return 'Searched guidelines'
}

type AgentToolPart = UIMessage['parts'][number] & {
	output?: unknown
	state?: string
	type: string
}
