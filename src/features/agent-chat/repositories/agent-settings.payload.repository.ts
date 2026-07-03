import config from '@payload-config'
import { getPayload } from 'payload'
import type { AgentDefaultInstructionValues } from '../agent-default-instructions'

export async function findAgentSettingsGlobal(
	user: unknown,
): Promise<AgentDefaultInstructionValues> {
	const payload = await getPayload({ config })

	return payload.findGlobal({
		slug: 'agent-settings',
		depth: 0,
		overrideAccess: false,
		user: user as never,
	}) as Promise<AgentDefaultInstructionValues>
}
