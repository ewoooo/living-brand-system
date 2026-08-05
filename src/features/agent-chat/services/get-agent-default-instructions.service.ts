import config from '@payload-config'
import { getPayload } from 'payload'
import {
	type AgentDefaultInstructionValues,
	agentDefaultInstructionSections,
} from '../utils/agent-default-instructions'

/**
 * Agent chat runtime에 공통 system prompt 섹션을 제공한다.
 * agent-settings Global 조회(Payload Local API I/O)도 이 service가 직접 소유한다 —
 * 단일 조회 + 직렬화뿐이라 별도 repository 계층을 두지 않는다.
 */
export async function getAgentDefaultInstructions(user: unknown): Promise<string> {
	const payload = await getPayload({ config })
	const settings = (await payload.findGlobal({
		slug: 'agent-settings',
		depth: 0,
		overrideAccess: false,
		user: user as never,
	})) as AgentDefaultInstructionValues

	return agentDefaultInstructionSections
		.map((section) => {
			const value = settings[section.field]?.trim() || section.defaultValue
			return `<${section.tag}>\n${value}\n</${section.tag}>`
		})
		.join('\n\n')
}
