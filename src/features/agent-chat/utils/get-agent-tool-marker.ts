import type { AgentChatMessage } from '@/agents/agent-chat.agent'

export interface AgentToolMarker {
	isPending: boolean
	text: string
}

export function getAgentReasoningMarker(
	message: AgentChatMessage,
	isActive = false,
): AgentToolMarker | null {
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

export function getAgentSkillMarker(message: AgentChatMessage): AgentToolMarker | null {
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

const countArrayLength = (output: unknown) => (Array.isArray(output) ? output.length : 0)
const countPresence = (output: unknown) => (output ? 1 : 0)
const countCheckResult = (output: unknown) =>
	typeof output === 'object' && output !== null && 'checkSessionId' in output ? 1 : 0

/** 우선순위 순서 — 첫 번째로 count > 0인 행의 문구를 쓴다. */
const TOOL_MARKER_RULES: {
	type: string
	count: (output: unknown) => number
	text: (count: number) => string
}[] = [
	{
		type: 'tool-listGuidelinePages',
		count: countArrayLength,
		text: (count) => `가이드라인 섹션 ${count}개를 확인했습니다`,
	},
	{
		type: 'tool-readGuidelineDocument',
		count: countPresence,
		text: (count) => `가이드라인 문서 ${count}개를 읽었습니다`,
	},
	{
		type: 'tool-searchGuidelines',
		count: countArrayLength,
		text: (count) => `가이드라인 결과 ${count}개를 찾았습니다`,
	},
	{
		type: 'tool-getRuleCatalog',
		count: countArrayLength,
		text: (count) => `룰 카탈로그 ${count}개를 확인했습니다`,
	},
	{
		type: 'tool-prepareTemplateImage',
		count: countPresence,
		text: (count) => `템플릿 이미지 ${count}개를 준비했습니다`,
	},
	{
		type: 'tool-runCheck',
		count: countCheckResult,
		text: (count) => `이미지 검수 ${count}건을 완료했습니다`,
	},
	{
		type: 'tool-findTemplatesForRequest',
		count: countArrayLength,
		text: (count) => `템플릿 ${count}개를 확인했습니다`,
	},
]

export function getAgentToolMarker(message: AgentChatMessage): AgentToolMarker | null {
	let hasToolPart = false
	let hasPendingToolPart = false
	let hasCheck = false
	let hasTemplateSearch = false
	const markers = TOOL_MARKER_RULES.map((rule) => ({ rule, count: 0 }))

	for (const part of message.parts) {
		if (!isAgentToolPart(part) || part.type === 'tool-loadSkill') {
			continue
		}

		hasToolPart = true
		hasPendingToolPart ||= !isFinishedToolPart(part)
		hasCheck ||= part.type === 'tool-runCheck'

		if (part.state !== 'output-available') {
			continue
		}

		for (const marker of markers) {
			if (part.type === marker.rule.type) {
				marker.count += marker.rule.count(part.output)
			}
		}

		hasTemplateSearch ||=
			part.type === 'tool-findTemplatesForRequest' && Array.isArray(part.output)
	}

	if (!hasToolPart) {
		return null
	}

	const matched = markers.find((marker) => marker.count > 0)

	if (matched) {
		return {
			isPending: hasPendingToolPart,
			text: matched.rule.text(matched.count),
		}
	}

	return {
		isPending: hasPendingToolPart,
		text: hasCheck
			? hasPendingToolPart
				? '이미지를 검수하고 있습니다'
				: '이미지 검수를 완료했습니다'
			: hasTemplateSearch
				? hasPendingToolPart
					? '템플릿을 찾고 있습니다'
					: '템플릿 검색을 완료했습니다'
				: hasPendingToolPart
					? '가이드라인을 찾고 있습니다'
					: '가이드라인 검색을 완료했습니다',
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
