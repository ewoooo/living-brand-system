import type { AgentChatMessage } from './services/create-agent-chat-response.service'

export interface AgentToolMarker {
	isPending: boolean
	text: string
}

export interface AgentSkillMarker {
	isPending: boolean
	text: string
}

export interface AgentReasoningMarker {
	isPending: boolean
	text: string
}

export function getAgentReasoningMarker(
	message: AgentChatMessage,
	isActive = false,
): AgentReasoningMarker | null {
	const reasoningParts = message.parts.filter((part) => part.type === 'reasoning')

	if (reasoningParts.length === 0) {
		return isActive ? { isPending: true, text: 'Reasoning' } : null
	}

	const isPending = reasoningParts.some((part) => part.state === 'streaming')

	return {
		isPending,
		text: isPending ? 'Reasoning' : 'Reasoning complete',
	}
}

export function getAgentSkillMarker(message: AgentChatMessage): AgentSkillMarker | null {
	for (const part of message.parts) {
		if (part.type !== 'tool-loadSkill') {
			continue
		}

		if (part.state === 'output-available' && hasSkillName(part.output)) {
			return {
				isPending: false,
				text: part.output.name,
			}
		}

		if (hasSkillName(part.input)) {
			return {
				isPending: !isFinishedToolPart(part),
				text: part.input.name,
			}
		}

		return {
			isPending: !isFinishedToolPart(part),
			text: 'Loading Skill',
		}
	}

	return null
}

export function getAgentToolMarker(message: AgentChatMessage): AgentToolMarker | null {
	let hasToolPart = false
	let hasPendingToolPart = false
	let listCount = 0
	let readCount = 0
	let ruleCount = 0
	let searchResultCount = 0

	for (const part of message.parts) {
		if (!isAgentToolPart(part)) {
			continue
		}

		if (part.type === 'tool-loadSkill') {
			continue
		}

		hasToolPart = true
		hasPendingToolPart ||= !isFinishedToolPart(part)

		if (
			part.type === 'tool-listGuidelinePages' &&
			part.state === 'output-available' &&
			Array.isArray(part.output)
		) {
			listCount += part.output.length
		}

		if (
			part.type === 'tool-readGuidelineDocument' &&
			part.state === 'output-available' &&
			part.output
		) {
			readCount += 1
		}

		if (
			part.type === 'tool-searchGuidelines' &&
			part.state === 'output-available' &&
			Array.isArray(part.output)
		) {
			searchResultCount += part.output.length
		}

		if (
			part.type === 'tool-getRuleCatalog' &&
			part.state === 'output-available' &&
			Array.isArray(part.output)
		) {
			ruleCount += part.output.length
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

	if (ruleCount > 0) {
		return {
			isPending: hasPendingToolPart,
			text: `룰 카탈로그 ${ruleCount}개를 확인했습니다`,
		}
	}

	return {
		isPending: hasPendingToolPart,
		text: hasPendingToolPart ? '가이드라인을 찾고 있습니다' : '가이드라인 검색을 완료했습니다',
	}
}

type AgentToolPart = Extract<AgentChatMessage['parts'][number], { type: `tool-${string}` }>

function isAgentToolPart(part: AgentChatMessage['parts'][number]): part is AgentToolPart {
	return part.type.startsWith('tool-')
}

function isFinishedToolPart(part: AgentToolPart) {
	return (
		part.state === 'output-available' ||
		part.state === 'output-error' ||
		part.state === 'output-denied'
	)
}

function hasSkillName(output: unknown): output is { name: string } {
	return (
		typeof output === 'object' &&
		output !== null &&
		'name' in output &&
		typeof output.name === 'string'
	)
}
