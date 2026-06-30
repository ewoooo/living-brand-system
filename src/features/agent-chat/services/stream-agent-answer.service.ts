import { anthropic } from '@ai-sdk/anthropic'
import { generateText, isStepCount, Output, streamText } from 'ai'
import {
	type AgentSkillId,
	buildAgentInstructions,
	buildAgentSkillSelectionPrompt,
	getAgentSkillIds,
	getDefaultAgentSkillId,
	shouldSelectAgentSkill,
} from '@/features/agent-chat/agent-skills'
import { AgentConfigurationError } from '@/lib/errors'
import type {
	AgentAnswerInput,
	AgentAnswerService,
	AgentAnswerStream,
} from './run-agent-chat.service'

const DEFAULT_MODEL = 'claude-sonnet-4-5'

/**
 * Agent 답변 스트림 생성을 AI SDK로 위임하는 adapter다.
 * 모델 호출은 이 구현체가 맡고, tool 구성과 guideline I/O는 answer service가 넘긴다.
 */
export class StreamAgentAnswerService implements AgentAnswerService {
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
			tools: input.tools,
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
