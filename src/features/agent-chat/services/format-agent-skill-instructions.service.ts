/**
 * 이미 선택된 agent skill을 provider instruction 문자열로 만든다.
 * Payload 조회와 접근 제어는 skill resolver와 repository가 맡는다.
 */
export function formatAgentSkillInstructions(skill: {
	body: string
	references?: { body: string; title: string }[] | null
}) {
	const references =
		skill.references
			?.map((reference) => `## ${reference.title}\n${reference.body}`)
			.join('\n\n') || ''

	return [skill.body, references ? `# Skill references\n\n${references}` : null]
		.filter(Boolean)
		.join('\n\n')
}
