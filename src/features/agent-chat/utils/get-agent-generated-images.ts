import type { AgentChatMessage } from '@/agents/agent-chat.agent'

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
