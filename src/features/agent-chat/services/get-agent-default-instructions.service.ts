import { findAgentSettingsGlobal } from '../repositories/agent-settings.payload.repository'
import {
	type AgentDefaultInstructionValues,
	agentDefaultInstructionSections,
} from '../utils/agent-default-instructions'

/**
 * Agent chat runtime에 공통 system prompt 섹션을 제공한다.
 * Payload Global I/O는 agent-settings repository가 소유한다.
 */
export async function getAgentDefaultInstructions(user: unknown): Promise<string> {
	return formatAgentDefaultInstructions(await findAgentSettingsGlobal(user))
}

/**
 * Agent 설정 문서를 모델 instruction 문자열로 직렬화한다.
 * 저장소 I/O는 repository가 소유하고, 이 함수는 순수 포맷팅만 담당한다.
 */
export function formatAgentDefaultInstructions(settings: AgentDefaultInstructionValues): string {
	return agentDefaultInstructionSections
		.map((section) => {
			const value = settings[section.field]?.trim() || section.defaultValue
			return `<${section.tag}>\n${value}\n</${section.tag}>`
		})
		.join('\n\n')
}
