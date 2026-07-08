import type { AgentChatMessage } from '@/agents/agent-chat.agent'

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
		return output.type === 'template-image'
			? [
					{
						attachment: output,
						key: part.toolCallId ?? `${output.templateId}-${index}`,
					},
				]
			: []
	})
}
