import type { ModelMessage } from 'ai'

const agentSkills = [
	{
		id: 'guideline-qa',
		description: 'Answer questions for creators using published brand guideline context.',
		instructions: [
			'You answer questions for creators using only published brand guideline context.',
			'Always answer in Korean.',
			'Use searchGuidelines when the current page context is not enough.',
			'If the provided context is not enough, say that a manager review is needed.',
		],
	},
] as const

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
 * Agent repository가 요청에 맞는 skill을 고를 때 쓰는 prompt만 만든다.
 * 실제 모델 호출은 repository 구현체가 담당한다.
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
 * Agent repository가 모델에 전달할 system instructions만 조합한다.
 * 외부 검색과 모델 실행은 repository와 tool 계층이 담당한다.
 */
export function buildAgentInstructions(skillId: AgentSkillId, context?: string) {
	const skill = agentSkills.find((item) => item.id === skillId) ?? agentSkills[0]

	return [...skill.instructions, context ? `Published context:\n${context}` : null]
		.filter(Boolean)
		.join('\n\n')
}
