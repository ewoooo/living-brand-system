import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { readSkillName } from '@/features/agent-chat/domain/agent-skill-tool-policy'

export function getAgentMessageText(message: AgentChatMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}

/**
 * generateImage tool 출력에서 생성된 이미지 후보 첨부만 파생한다.
 * 모델 텍스트가 아니라 tool 출력이므로 실제 생성된 이미지만 첨부된다.
 */
export function getAgentGeneratedImages(message: AgentChatMessage) {
	return message.parts.flatMap((part, index) => {
		if (part.type !== 'tool-generateImage' || part.state !== 'output-available') {
			return []
		}

		const output = part.output
		return output.type === 'generated-images' && output.images.length > 0
			? [{ attachment: output, key: part.toolCallId ?? `generated-${index}` }]
			: []
	})
}

/**
 * prepareTemplateImage tool 출력에서 실제 준비된 템플릿 이미지 첨부만 파생한다.
 * 모델 텍스트가 아니라 tool 출력이므로 준비되지 않은 템플릿은 첨부될 수 없다.
 */
export function getAgentTemplateAttachments(message: AgentChatMessage) {
	return message.parts.flatMap((part, index) => {
		if (part.type !== 'tool-prepareTemplateImage' || part.state !== 'output-available') {
			return []
		}

		const output = part.output
		// JSON 템플릿 제거 전에 저장된 첨부는 렌더하지 않는다.
		return output.type === 'template-image' && output.kind === 'html'
			? [
					{
						attachment: output,
						key: part.toolCallId ?? `${output.templateId}-${index}`,
					},
				]
			: []
	})
}

export interface AgentCitation {
	key: string
	title: string
	href: string | null
}

/**
 * 에이전트가 readGuidelineDocument로 실제 읽은 문서만 출처로 수집한다 (중복 제거).
 * 모델 생성값이 아니라 tool 출력에서 파생하므로 읽지 않은 문서는 인용될 수 없다.
 */
export function getAgentCitations(message: AgentChatMessage): AgentCitation[] {
	const citations = new Map<string, AgentCitation>()

	for (const part of message.parts) {
		if (part.type !== 'tool-readGuidelineDocument' || part.state !== 'output-available') {
			continue
		}

		const source = part.output?.source

		if (!source) {
			continue
		}

		citations.set(`${source.collection}:${source.id}`, {
			key: `${source.collection}:${source.id}`,
			title: source.title,
			href: source.href,
		})
	}

	return [...citations.values()]
}

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
		return isActive ? { isPending: true, text: '확인 중' } : null
	}

	const isPending = reasoningParts.some((part) => part.state === 'streaming')

	return {
		isPending,
		text: isPending ? '확인 중' : '확인 완료',
	}
}

export function getAgentSkillMarker(message: AgentChatMessage): AgentToolMarker | null {
	for (const part of message.parts) {
		if (part.type !== 'tool-loadSkill') {
			continue
		}

		if (part.state === 'output-available') {
			const outputName = readSkillName(part.output)
			if (outputName) {
				return { isPending: false, text: outputName }
			}
		}

		const inputName = readSkillName(part.input)
		if (inputName) {
			return {
				isPending: !isFinishedToolPart(part),
				text: inputName,
			}
		}

		return {
			isPending: !isFinishedToolPart(part),
			text: 'Loading Skill',
		}
	}

	return null
}

const sumArrayLengths = (outputs: unknown[]) =>
	outputs.reduce<number>((sum, output) => sum + (Array.isArray(output) ? output.length : 0), 0)
const countPresent = (outputs: unknown[]) => outputs.filter(Boolean).length
const markerText = (count: number, text: (count: number) => string) =>
	count > 0 ? text(count) : null

/** 우선순위 순서(위가 먼저) — 처음으로 결과 문구를 만든 tool의 문구를 쓴다. */
const toolMarkerTexts: Record<string, (outputs: unknown[]) => string | null> = {
	'tool-listGuidelineDocuments': (outputs) =>
		markerText(
			sumArrayLengths(outputs),
			(count) => `가이드라인 문서 ${count}개를 확인했습니다`,
		),
	'tool-readGuidelineDocument': (outputs) =>
		markerText(countPresent(outputs), (count) => `가이드라인 문서 ${count}개를 읽었습니다`),
	'tool-searchGuidelines': (outputs) =>
		markerText(sumArrayLengths(outputs), (count) => `가이드라인 결과 ${count}개를 찾았습니다`),
	'tool-getCheckCatalog': (outputs) =>
		markerText(sumArrayLengths(outputs), (count) => `Check 카탈로그 ${count}개를 확인했습니다`),
	'tool-listCheckScenarios': (outputs) =>
		markerText(sumArrayLengths(outputs), (count) => `검수 시나리오 ${count}개를 확인했습니다`),
	'tool-prepareTemplateImage': (outputs) =>
		markerText(countPresent(outputs), (count) => `템플릿 이미지 ${count}개를 준비했습니다`),
	'tool-runCheck': (outputs) =>
		markerText(
			outputs.filter(
				(output) =>
					typeof output === 'object' && output !== null && 'checkSessionId' in output,
			).length,
			(count) => `이미지 검수 ${count}건을 완료했습니다`,
		),
	'tool-generateImage': (outputs) =>
		markerText(
			outputs.reduce<number>(
				(sum, output) =>
					sum +
					(typeof output === 'object' &&
					output !== null &&
					'images' in output &&
					Array.isArray(output.images)
						? output.images.length
						: 0),
				0,
			),
			(count) => `이미지 ${count}개를 생성했습니다`,
		),
	'tool-listImageProfiles': (outputs) =>
		markerText(sumArrayLengths(outputs), (count) => `이미지 프로필 ${count}개를 확인했습니다`),
	'tool-findTemplatesForRequest': (outputs) =>
		markerText(sumArrayLengths(outputs), (count) => `템플릿 ${count}개를 확인했습니다`),
}

export function getAgentToolMarker(message: AgentChatMessage): AgentToolMarker | null {
	const seenTypes = new Set<string>()
	const outputsByType = new Map<string, unknown[]>()
	let isPending = false

	for (const part of message.parts) {
		if (!isAgentToolPart(part) || part.type === 'tool-loadSkill') {
			continue
		}

		seenTypes.add(part.type)
		isPending ||= !isFinishedToolPart(part)

		if (part.state !== 'output-available') {
			continue
		}

		const outputs = outputsByType.get(part.type) ?? []
		outputs.push(part.output)
		outputsByType.set(part.type, outputs)
	}

	if (seenTypes.size === 0) {
		return null
	}

	for (const [type, toText] of Object.entries(toolMarkerTexts)) {
		const text = toText(outputsByType.get(type) ?? [])
		if (text) {
			return { isPending, text }
		}
	}

	// 결과 문구가 없을 때의 진행/완료 fallback — 검수 > 이미지 생성 > 템플릿 검색 > 가이드라인 순.
	if (seenTypes.has('tool-runCheck')) {
		return {
			isPending,
			text: isPending ? '이미지를 검수하고 있습니다' : '이미지 검수를 완료했습니다',
		}
	}
	if (seenTypes.has('tool-generateImage')) {
		return {
			isPending,
			text: isPending ? '이미지를 생성하고 있습니다' : '이미지 생성을 완료했습니다',
		}
	}
	if ((outputsByType.get('tool-findTemplatesForRequest') ?? []).some(Array.isArray)) {
		return {
			isPending,
			text: isPending ? '템플릿을 찾고 있습니다' : '템플릿 검색을 완료했습니다',
		}
	}
	if ((outputsByType.get('tool-searchGuidelines') ?? []).some(Array.isArray)) {
		return { isPending, text: '가이드라인 결과 0개를 찾았습니다' }
	}
	return {
		isPending,
		text: isPending ? '가이드라인을 찾고 있습니다' : '가이드라인 검색을 완료했습니다',
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
