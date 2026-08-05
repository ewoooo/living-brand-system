import { z } from 'zod'

/** loadSkill 입력 — Agent가 선택하는 skill 이름. */
export const agentSkillSelectionSchema = z.strictObject({
	name: z.string().trim().min(1).max(80),
})

const skillNameSchema = z.object({ name: z.string() })

/** tool 입력/출력에서 skill 이름만 느슨하게 읽는다. 이름이 없거나 문자열이 아니면 null. */
export function readSkillName(value: unknown): string | null {
	const parsed = skillNameSchema.safeParse(value)
	return parsed.success ? parsed.data.name : null
}

type AgentTaskToolName =
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
	'answer-guideline': [
		'listGuidelineDocuments',
		'searchGuidelines',
		'readGuidelineDocument',
		'getCheckCatalog',
	],
	'create-from-template': ['findTemplatesForRequest', 'prepareTemplateImage'],
	'generate-image': ['listImageProfiles', 'generateImage'],
	'generate-text': ['searchGuidelines', 'readGuidelineDocument'],
	'review-asset': ['listCheckScenarios', 'getCheckCatalog', 'runCheck'],
} as const satisfies Record<string, readonly AgentTaskToolName[]>

export function getAgentExecutionPolicy(decision: { name: string }) {
	const tools = toolsBySkill[decision.name as keyof typeof toolsBySkill]

	return {
		activeTools: tools ? [...tools] : ([] as AgentTaskToolName[]),
		modelId: 'claude-sonnet-5',
	}
}
