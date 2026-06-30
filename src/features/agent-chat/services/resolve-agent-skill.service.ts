import {
	type AgentSkillDetail,
	findEnabledAgentSkillByName,
	findEnabledAgentSkillSummaries,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { AgentConfigurationError } from '@/lib/errors'

export type ResolveAgentSkillInput = {
	requestedSkillId?: string
	user: unknown
}

export type ResolveAgentSkillOutput = AgentSkillDetail

/**
 * Agent 실행 전에 사용할 skill 하나를 고른다.
 * Payload 조회는 agent skill repository가 맡고, 여기서는 requested/default 정책만 적용한다.
 */
export async function resolveAgentSkill(
	input: ResolveAgentSkillInput,
): Promise<ResolveAgentSkillOutput> {
	const summaries = await findEnabledAgentSkillSummaries(input.user)
	const defaultSkills = summaries.filter((skill) => skill.isDefault)

	if (defaultSkills.length > 1) {
		throw new AgentConfigurationError('Agent skill is not configured.')
	}

	const selectedName =
		input.requestedSkillId ??
		(defaultSkills.length === 1 ? defaultSkills[0]?.name : undefined) ??
		(defaultSkills.length === 0 && summaries.length === 1 ? summaries[0]?.name : undefined)

	if (!selectedName) {
		throw new AgentConfigurationError('Agent skill is not configured.')
	}

	const skill = await findEnabledAgentSkillByName(input.user, selectedName)

	if (!skill) {
		throw new AgentConfigurationError('Agent skill is not configured.')
	}

	return skill
}
