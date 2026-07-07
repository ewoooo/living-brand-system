import type { GlobalConfig } from 'payload'
import { agentDefaultInstructionSections } from '@/features/agent-chat/utils/agent-default-instructions'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const AgentSettings: GlobalConfig = {
	slug: 'agent-settings',
	label: 'Agent Settings',
	admin: {
		group: 'Agent',
	},
	access: {
		read: authenticated,
		update: managerOrAdmin,
	},
	fields: agentDefaultInstructionSections.map((section) => ({
		name: section.field,
		type: 'textarea',
		label: section.label,
		required: true,
		defaultValue: section.defaultValue,
		admin: {
			description: `Default system prompt section rendered as <${section.tag}>.`,
		},
	})),
}
