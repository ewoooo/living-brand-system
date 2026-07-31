import type { AgentQueryTriageDecision } from './agent-query-triage'

const modelIdByTriageModel = {
	'haiku-4.5': 'claude-haiku-4-5',
	'sonnet-5': 'claude-sonnet-5',
	'opus-5.0': 'claude-opus-5',
} satisfies Record<AgentQueryTriageDecision['model'], string>

export type AgentTaskToolName =
	| 'findTemplatesForRequest'
	| 'generateImage'
	| 'getCheckCatalog'
	| 'listCheckScenarios'
	| 'listGuidelineDocuments'
	| 'listImageProfiles'
	| 'prepareTemplateImage'
	| 'readGuidelineDocument'
	| 'runCheck'
	| 'searchGuidelines'

const toolsBySkill = {
	'answer-guideline': {
		read: [
			'listGuidelineDocuments',
			'searchGuidelines',
			'readGuidelineDocument',
			'getCheckCatalog',
		],
		action: [],
	},
	'create-from-template': {
		read: ['findTemplatesForRequest'],
		action: ['prepareTemplateImage'],
	},
	'generate-image': {
		read: ['listImageProfiles'],
		action: ['generateImage'],
	},
	'generate-text': {
		read: ['searchGuidelines', 'readGuidelineDocument'],
		action: [],
	},
	'review-asset': {
		read: ['listCheckScenarios', 'getCheckCatalog', 'runCheck'],
		action: [],
	},
} as const satisfies Record<
	string,
	{ read: readonly AgentTaskToolName[]; action: readonly AgentTaskToolName[] }
>

export function getAllowedAgentTools(
	skillName: string,
	toolScope: AgentQueryTriageDecision['toolScope'],
): AgentTaskToolName[] {
	const policy = toolsBySkill[skillName as keyof typeof toolsBySkill]
	if (!policy || toolScope === 'none') return []

	return toolScope === 'read' ? [...policy.read] : [...policy.read, ...policy.action]
}

export function getAgentExecutionPolicy(
	decision: Pick<AgentQueryTriageDecision, 'model' | 'name' | 'toolScope'>,
) {
	return {
		activeTools: getAllowedAgentTools(decision.name, decision.toolScope),
		modelId: modelIdByTriageModel[decision.model],
	}
}
