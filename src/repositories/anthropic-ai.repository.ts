import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

import type { AgentAnswerInput, AgentAnswerStream, AgentRepository } from './agent.repository'

const DEFAULT_MODEL = 'claude-sonnet-4-5'

export class AnthropicAiRepository implements AgentRepository {
	streamAnswer(input: AgentAnswerInput): AgentAnswerStream {
		return streamText({
			model: anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL),
			system: [
				'You answer questions for creators using only published brand guideline context.',
				'If the provided context is not enough, say that a manager review is needed.',
				input.context ? `Published context:\n${input.context}` : null,
			]
				.filter(Boolean)
				.join('\n\n'),
			messages: input.messages,
		})
	}
}
