import type { AgentChatMessage } from '../services/create-agent-chat-response.service'

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
