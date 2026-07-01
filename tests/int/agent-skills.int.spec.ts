import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	findEnabledAgentSkillByName,
	findEnabledAgentSkillSummaries,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { formatAgentSkillInstructions } from '@/features/agent-chat/services/format-agent-skill-instructions.service'
import { resolveAgentSkill } from '@/features/agent-chat/services/resolve-agent-skill.service'
import { AgentConfigurationError } from '@/lib/errors'

vi.mock('@/features/agent-chat/repositories/agent-skill.payload.repository', () => ({
	findEnabledAgentSkillByName: vi.fn(),
	findEnabledAgentSkillSummaries: vi.fn(),
}))

const skill = {
	name: 'guideline-qa',
	description: 'Answer questions using guideline context.',
	body: 'Use listGuidelinePages when the user asks what pages are available.',
}

describe('agent skills', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('loads the requested enabled skill body', async () => {
		vi.mocked(findEnabledAgentSkillSummaries).mockResolvedValue([
			{ name: skill.name, description: skill.description, isDefault: true },
		])
		vi.mocked(findEnabledAgentSkillByName).mockResolvedValue(skill)

		await expect(
			resolveAgentSkill({ requestedSkillId: skill.name, user: { id: 1 } }),
		).resolves.toEqual(skill)

		expect(findEnabledAgentSkillByName).toHaveBeenCalledWith({ id: 1 }, skill.name)
	})

	it('adds reference headings to skill instructions', () => {
		expect(
			formatAgentSkillInstructions({
				...skill,
				references: [{ title: 'Answer shape', body: 'Start with the direct answer.' }],
			}),
		).toBe(
			[
				skill.body,
				'# Skill references',
				'## Answer shape\nStart with the direct answer.',
			].join('\n\n'),
		)
	})

	it('fails when no enabled skill can be selected', async () => {
		vi.mocked(findEnabledAgentSkillSummaries).mockResolvedValue([
			{ name: 'first', description: 'First skill.', isDefault: false },
			{ name: 'second', description: 'Second skill.', isDefault: false },
		])

		await expect(resolveAgentSkill({ user: { id: 1 } })).rejects.toBeInstanceOf(
			AgentConfigurationError,
		)

		expect(findEnabledAgentSkillByName).not.toHaveBeenCalled()
	})

	it('fails when multiple enabled skills are default', async () => {
		vi.mocked(findEnabledAgentSkillSummaries).mockResolvedValue([
			{ name: 'first', description: 'First skill.', isDefault: true },
			{ name: 'second', description: 'Second skill.', isDefault: true },
		])

		await expect(resolveAgentSkill({ user: { id: 1 } })).rejects.toBeInstanceOf(
			AgentConfigurationError,
		)

		expect(findEnabledAgentSkillByName).not.toHaveBeenCalled()
	})
})
