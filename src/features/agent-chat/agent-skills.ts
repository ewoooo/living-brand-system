import type { ModelMessage } from 'ai'
import guidelineQaSkill from './skills/guideline-qa.json'

const agentSkills = [guidelineQaSkill] as const

export type AgentSkillId = (typeof agentSkills)[number]['id']

const defaultAgentSkillId: AgentSkillId = 'guideline-qa'

export function getAgentSkillIds(): [AgentSkillId, ...AgentSkillId[]] {
	return agentSkills.map((skill) => skill.id) as [AgentSkillId, ...AgentSkillId[]]
}

export function shouldSelectAgentSkill() {
	return agentSkills.length > 1
}

export function getDefaultAgentSkillId() {
	return defaultAgentSkillId
}

/**
 * Agent answer service가 요청에 맞는 skill을 고를 때 쓰는 prompt만 만든다.
 * 실제 모델 호출은 provider service가 담당한다.
 */
export function buildAgentSkillSelectionPrompt(input: {
	messages: ModelMessage[]
	context?: string
}) {
	return [
		'Choose the single best skill id for this agent request.',
		'Skills:',
		...agentSkills.map((skill) => `- ${skill.id}: ${skill.description}`),
		input.context ? `Context:\n${input.context}` : null,
		`Recent messages:\n${JSON.stringify(input.messages.slice(-4))}`,
	]
		.filter(Boolean)
		.join('\n\n')
}

/**
 * Agent answer service가 모델에 전달할 system instructions만 조합한다.
 * guideline 외부 I/O와 모델 실행은 context service와 provider service가 담당한다.
 */
export function buildAgentInstructions(skillId: AgentSkillId, context?: string) {
	const skill = agentSkills.find((item) => item.id === skillId) ?? agentSkills[0]

	return [...skill.instructions, context ? `Published context:\n${context}` : null]
		.filter(Boolean)
		.join('\n\n')
}
