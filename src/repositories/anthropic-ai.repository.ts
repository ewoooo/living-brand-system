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
import { GetAgentGuidelineContextService } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { AgentConfigurationError } from '@/lib/errors'
import { PayloadAgentGuidelineContextRepository } from '@/repositories/agent-guideline-context.payload.repository'
import type { AgentAnswerInput, AgentAnswerStream, AgentRepository } from './agent.repository'

const DEFAULT_MODEL = 'claude-sonnet-4-5'

/**
 * Agent 답변 스트림 생성을 AI SDK로 위임하는 adapter다.
 * 모델 호출은 이 구현체가 맡고, guideline tool I/O는 agent tool service가 담당한다.
 */
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
			stopWhen: isStepCount(5),
			tools: createAgentTools({
				getAgentGuidelineContextService: new GetAgentGuidelineContextService(
					new PayloadAgentGuidelineContextRepository(input.user),
				),
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
