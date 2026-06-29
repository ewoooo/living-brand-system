import { anthropic } from '@ai-sdk/anthropic'
import { generateText, isStepCount, Output, streamText } from 'ai'

import {
	type AgentSkillId,
	buildAgentInstructions,
	buildAgentSkillSelectionPrompt,
	getAgentSkillIds,
	getDefaultAgentSkillId,
	shouldSelectAgentSkill,
} from '@/agents/agent-skills'
import { createAgentTools } from '@/agents/agent-tools'
import { AgentConfigurationError } from '@/lib/errors'
import { PayloadGuidelineSearchRepository } from '@/repositories/guideline-search.payload.repository'
import type { AgentAnswerInput, AgentAnswerStream, AgentRepository } from './agent.repository'

const DEFAULT_MODEL = 'claude-sonnet-4-5'

export class AnthropicAiRepository implements AgentRepository {
	async streamAnswer(input: AgentAnswerInput): Promise<AgentAnswerStream> {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new AgentConfigurationError()
		}

		const skillId = await this.selectSkill(input)

		return streamText({
			model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
			instructions: buildAgentInstructions(skillId, input.context),
			messages: input.messages,
			stopWhen: isStepCount(3),
			tools: createAgentTools({
				guidelineSearchRepository: new PayloadGuidelineSearchRepository(input.user),
			}),
		})
	}

	private async selectSkill(input: AgentAnswerInput): Promise<AgentSkillId> {
		if (!shouldSelectAgentSkill()) {
			return getDefaultAgentSkillId()
		}

		const result = await generateText({
			model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
			output: Output.choice({ options: getAgentSkillIds() }),
			prompt: buildAgentSkillSelectionPrompt(input),
		})

		return result.output
	}
}
