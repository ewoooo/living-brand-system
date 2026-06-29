import { describe, expect, it } from 'vitest'
import {
	buildAgentInstructions,
	buildAgentSkillSelectionPrompt,
	getDefaultAgentSkillId,
} from '@/agents/agent-skills'

describe('agent skills', () => {
	it('adds request context to base instructions', () => {
		expect(
			buildAgentInstructions(
				getDefaultAgentSkillId(),
				'Current guideline page: /guideline/logo',
			),
		).toContain('Published context:\nCurrent guideline page: /guideline/logo')
	})

	it('builds a skill selection prompt', () => {
		const prompt = buildAgentSkillSelectionPrompt({
			messages: [{ role: 'user', content: 'How should I use the logo?' }],
		})

		expect(prompt).toContain('guideline-qa')
	})
})
